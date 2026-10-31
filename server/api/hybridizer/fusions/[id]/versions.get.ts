import { defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import {
  requireVisibleFusion,
  versionProjectSlug,
  versionSummaries,
} from '~/server/utils/hybridizerVersions'

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
        versions: await versionSummaries(fusion, auth?.user.id),
        canEdit: Boolean(
          auth && (auth.isAdmin || fusion.creatorUserId === auth.user.id),
        ),
      },
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
