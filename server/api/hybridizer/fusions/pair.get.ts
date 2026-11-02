import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import {
  canonicalFusionPair,
  clientIngredientKey,
} from '~/server/utils/hybridizerFusion'
import { requireVisibleFusion } from '~/server/utils/hybridizerVersions'

// Read-only lookup of an already-discovered pair, so the lab can show a
// pregenerated hybrid (the launch set) as soon as two ingredients are chosen,
// for visitors too. Creating a fusion stays POST /api/hybridizer/fusions.
export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)
    const query = getQuery(event)
    let pair: ReturnType<typeof canonicalFusionPair>
    try {
      pair = canonicalFusionPair(
        String(query.left ?? ''),
        String(query.right ?? ''),
      )
    } catch (error) {
      throw createError({
        statusCode: 400,
        message:
          error instanceof Error ? error.message : 'Invalid Hybridizer inputs.',
      })
    }
    const fusion = await prisma.hybridizerFusion.findUnique({
      where: { id: pair.id },
    })
    requireVisibleFusion(fusion, auth?.user.id)
    return {
      success: true,
      data: {
        key: 'fusion:' + fusion.id,
        title: fusion.title,
        taxonomy: 'HYBRID',
        sources: [
          clientIngredientKey(fusion.leftKey),
          clientIngredientKey(fusion.rightKey),
        ],
        depth: fusion.depth,
        status: fusion.status,
        isPublic: fusion.isPublic,
        createdAt: fusion.createdAt,
        artJobId: fusion.artJobId,
        artImageId: fusion.artImageId,
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
