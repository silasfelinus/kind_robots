import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { clientIngredientKey } from '~/server/utils/hybridizerFusion'
import { hybridizerDeliverableUrl } from '~/server/utils/hybridizerArt'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'

export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)
    const query = getQuery(event)
    const take = Math.min(1000, Math.max(1, Number(query.take) || 50))
    const skip = Math.max(0, Math.floor(Number(query.skip) || 0))
    const where = auth
      ? { OR: [{ isPublic: true }, { creatorUserId: auth.user.id }] }
      : { isPublic: true }
    const [records, grouped] = await Promise.all([
      prisma.hybridizerFusion.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        take,
        skip,
      }),
      prisma.hybridizerFusion.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ])
    const countFor = (status: string) =>
      grouped.find((item) => item.status === status)?._count._all ?? 0
    const total = grouped.reduce((sum, item) => sum + item._count._all, 0)
    const stats = {
      total,
      ready: countFor('READY'),
      rendering: countFor('QUEUED') + countFor('RENDERING') + countFor('DELIVERING'),
    }

    // The shelf shows each finished hybrid's picture without a status call per
    // card, under the same visibility rules as fusions/[id]/status.
    const imageIds = records
      .filter((record) => record.status === 'READY' && record.artImageId)
      .map((record) => record.artImageId as number)
    const images = imageIds.length
      ? await prisma.artImage.findMany({
          where: {
            AND: [
              { id: { in: imageIds } },
              buildArtImageWhere(await getArtImageAccessContext(event)),
            ],
          },
          select: {
            id: true,
            imagePath: true,
            isPublic: true,
            isMature: true,
            isActive: true,
            userId: true,
          },
        })
      : []
    const imageById = new Map(images.map((image) => [image.id, image]))
    function deliverablePath(record: (typeof records)[number]) {
      const image = record.artImageId
        ? imageById.get(record.artImageId)
        : undefined
      if (!image || image.isActive === false || image.isMature === true)
        return null
      const visible = record.isPublic
        ? image.isPublic === true
        : image.userId === record.creatorUserId ||
          image.userId === auth?.user.id
      return visible ? hybridizerDeliverableUrl(image.imagePath) : null
    }
    return {
      success: true,
      meta: stats,
      data: records.map((record) => ({
        key: 'fusion:' + record.id,
        title: record.title,
        taxonomy: 'HYBRID',
        sources: [
          clientIngredientKey(record.leftKey),
          clientIngredientKey(record.rightKey),
        ],
        depth: record.depth,
        createdAt: record.createdAt,
        status: record.status,
        isPublic: record.isPublic,
        artJobId: record.artJobId,
        artImageId: record.artImageId,
        imagePath: deliverablePath(record),
      })),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return {
      success: false,
      message: handled.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
