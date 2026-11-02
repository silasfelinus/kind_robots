import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { clientIngredientKey } from '~/server/utils/hybridizerFusion'
import { hybridizerDeliverableUrl } from '~/server/utils/hybridizerArt'

export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)
    const query = getQuery(event)
    const take = Math.min(1000, Math.max(1, Number(query.take) || 50))
    const records = await prisma.hybridizerFusion.findMany({
      where: auth
        ? { OR: [{ isPublic: true }, { creatorUserId: auth.user.id }] }
        : { isPublic: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take,
    })
    // The shelf shows each finished hybrid's picture without a status call per
    // card, under the same visibility rules as fusions/[id]/status.
    const imageIds = records
      .filter((record) => record.status === 'READY' && record.artImageId)
      .map((record) => record.artImageId as number)
    const images = imageIds.length
      ? await prisma.artImage.findMany({
          where: { id: { in: imageIds } },
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
