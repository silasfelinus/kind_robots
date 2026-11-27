import { defineEventHandler, setHeader } from 'h3'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { monstriqueAudienceFor } from '~/server/utils/monstriqueAccess'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Authorization')
  const auth = await getOptionalApiUser(event)
  return { success: true, data: { audience: monstriqueAudienceFor(auth) } }
})
