import { createError, defineEventHandler, readBody } from 'h3'
import type { CthulhuquariumCurationUpdate } from '~/types/curationStudio'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { updateCthulhuquariumCuration } from '@/server/utils/cthulhuquariumCuration'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody(event)) as CthulhuquariumCurationUpdate | null
    if (!body?.slug) {
      throw createError({ statusCode: 400, statusMessage: 'Fish slug is required.' })
    }
    const entry = await updateCthulhuquariumCuration(body)
    return {
      success: true,
      message: `${body.slug} curation state saved.`,
      data: entry,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to save Cthulhuquarium curation state.',
      statusCode,
    }
  }
})
