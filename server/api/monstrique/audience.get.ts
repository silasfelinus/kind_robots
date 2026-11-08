import { defineEventHandler, setHeader } from 'h3'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { viewerShowsMature } from '~/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Authorization')
  const auth = await getOptionalApiUser(event)
  const humanSession =
    auth?.kind === 'jwt' || auth?.kind === 'user-api-key'
  return {
    success: true,
    data: {
      audience: humanSession && viewerShowsMature(auth.user) ? 'mature' : 'general',
    },
  }
})
