import { defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { clientIngredientKey } from '~/server/utils/hybridizerFusion'
import { requireVisibleFusion, versionProjectSlug } from '~/server/utils/hybridizerVersions'

export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)
    const id = getRouterParam(event, 'id') ?? ''
    versionProjectSlug(id)
    const fusion = await prisma.hybridizerFusion.findUnique({ where: { id } })
    requireVisibleFusion(fusion, auth?.user.id)
    return {
      success: true,
      data: {
        key: 'fusion:' + fusion.id,
        title: fusion.title,
        taxonomy: 'HYBRID',
        sources: [clientIngredientKey(fusion.leftKey), clientIngredientKey(fusion.rightKey)],
        depth: fusion.depth,
        status: fusion.status,
        createdAt: fusion.createdAt,
        artJobId: fusion.artJobId,
        artImageId: fusion.artImageId,
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { success: false, message: handled.message, statusCode: event.node.res.statusCode }
  }
})
