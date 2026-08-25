import { createError, defineEventHandler, readBody } from 'h3'
import type { MandarinCurationUpdate } from '~/types/mandarinCuration'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { updateMandarinCuration } from '@/server/utils/mandarinCatalogCuration'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body = (await readBody(event)) as MandarinCurationUpdate | null
    if (!body?.cardKey) {
      throw createError({
        statusCode: 400,
        message: 'Mandarin card key is required.',
      })
    }

    const result = await updateMandarinCuration({
      adminUserId: auth.user.id,
      body,
    })
    return {
      success: true,
      message: result.changed
        ? 'Mandarin catalog override saved.'
        : 'No learner-facing Mandarin changes to save.',
      data: result.row,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to save Mandarin catalog curation.',
      statusCode,
    }
  }
})
