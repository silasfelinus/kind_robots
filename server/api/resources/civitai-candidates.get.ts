// /server/api/resources/civitai-candidates.get.ts
//
// The ids the Civitai preview backfill needs, and nothing else.
//
// /api/resources deliberately does NOT return civitaiUrl: resourceListSelect
// was trimmed because the unpaginated catalog payload broke on a tablet, and
// the url is one of the long strings that went. So the backfill could not see
// which rows it could work on -- it read 2,343 resources and found 0 with a
// version id.
//
// Fetching /api/resources/:id for each row instead would be 2,343 round trips
// for four fields. This is one, admin-gated, ~60 bytes a row.
import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required.',
      })
    }

    const data = await prisma.resource.findMany({
      where: {
        isActive: true,
        // Only rows that could name an upstream model version at all.
        OR: [
          { civitaiModelVersionId: { not: null } },
          { civitaiUrl: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        // The backfill ORs this into every preview's isMature: Civitai's own
        // nsfwLevel is not trustworthy on its own (Fantasy_art_XL_V1 rates all
        // ten of its nudes `1`, i.e. PG), and a mature Resource's previews are
        // mature whatever upstream says.
        isMature: true,
        civitaiUrl: true,
        civitaiModelId: true,
        civitaiModelVersionId: true,
      },
      orderBy: { id: 'asc' },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `${data.length} resource(s) carry a Civitai reference.`,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to list Civitai candidates.',
      data: [],
      statusCode,
    }
  }
})
