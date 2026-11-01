import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { clientIngredientKey } from '~/server/utils/hybridizerFusion'

export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)
    const query = getQuery(event)
    const take = Math.min(100, Math.max(1, Number(query.take) || 50))
    const records = await prisma.hybridizerFusion.findMany({
      where: auth
        ? { OR: [{ isPublic: true }, { creatorUserId: auth.user.id }] }
        : { isPublic: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take,
    })
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
