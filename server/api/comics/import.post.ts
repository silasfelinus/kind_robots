import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { applyComicImport } from '@/server/utils/comicStudioImportApply'
import { normalizeComicImport } from '~/utils/comicStudioImport'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const { payload, errors } = normalizeComicImport(await readBody(event))
    if (!payload)
      throw createError({
        statusCode: 400,
        message: errors.join(' ') || 'Invalid import.',
      })
    const result = await applyComicImport(payload, auth.user.id)
    result.errors.unshift(...errors)
    const statusCode = result.errors.length ? 207 : 200
    event.node.res.statusCode = statusCode
    return {
      success: true,
      statusCode,
      message: `Imported ${result.created.entities} entities, ${result.created.slots} slots and ${result.created.attempts} attempts.`,
      data: result,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
