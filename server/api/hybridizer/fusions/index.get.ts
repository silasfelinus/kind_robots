import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { clientIngredientKey } from '~/server/utils/hybridizerFusion'
import { hybridizerDeliverableUrl } from '~/server/utils/hybridizerArt'
import type { Prisma } from '~/prisma/generated/prisma/client'
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
    const visibility: Prisma.HybridizerFusionWhereInput = auth
      ? { OR: [{ isPublic: true }, { creatorUserId: auth.user.id }] }
      : { isPublic: true }
    const status = typeof query.status === 'string' ? query.status : 'ALL'
    const search =
      typeof query.search === 'string' ? query.search.trim().slice(0, 100) : ''
    const ids =
      typeof query.ids === 'string'
        ? [
            ...new Set(
              query.ids.split(',').filter((id) => /^[a-f0-9]{64}$/.test(id)),
            ),
          ].slice(0, 100)
        : null
    const maxDepth = Number(query.maxDepth)
    const filters: Prisma.HybridizerFusionWhereInput[] = [visibility]
    if (status === 'READY')
      filters.push({ status: 'READY', artImageId: { not: null } })
    else if (status === 'IN_PROGRESS')
      filters.push({ status: { in: ['QUEUED', 'RENDERING', 'DELIVERING'] } })
    else if (status === 'OTHER')
      filters.push({
        OR: [
          { status: { notIn: ['READY', 'QUEUED', 'RENDERING', 'DELIVERING'] } },
          { status: 'READY', artImageId: null },
        ],
      })
    if (search) filters.push({ title: { contains: search } })
    if (ids !== null) filters.push({ id: { in: ids } })
    if (
      query.maxDepth !== undefined &&
      Number.isInteger(maxDepth) &&
      maxDepth >= 0 &&
      maxDepth <= 4
    )
      filters.push({ depth: { lte: maxDepth } })
    const where: Prisma.HybridizerFusionWhereInput = { AND: filters }
    const [records, grouped, filteredTotal] = await Promise.all([
      prisma.hybridizerFusion.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        take,
        skip,
      }),
      prisma.hybridizerFusion.groupBy({
        by: ['status'],
        where: visibility,
        _count: { _all: true },
      }),
      prisma.hybridizerFusion.count({ where }),
    ])
    const countFor = (status: string) =>
      grouped.find((item) => item.status === status)?._count._all ?? 0
    const total = grouped.reduce((sum, item) => sum + item._count._all, 0)
    const stats = {
      total,
      filteredTotal,
      ready: countFor('READY'),
      rendering:
        countFor('QUEUED') + countFor('RENDERING') + countFor('DELIVERING'),
    }

    // The shelf shows each finished hybrid's picture without a status call per
    // card, under the same visibility rules as fusions/[id]/status.
    const imageIds = records
      .filter((record) => record.artImageId)
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
