import { createError, defineEventHandler, setHeader } from 'h3'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { viewerShowsMature } from '~/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  const auth = await requireAdminApiUser(event)
  if (!viewerShowsMature(auth.user))
    throw createError({ statusCode: 404, statusMessage: 'Not found.' })

  setHeader(event, 'Cache-Control', 'private, no-store')
  return { success: true, data: { canPlay: true } }
})
