import { createError, defineEventHandler, getQuery, setHeader } from 'h3'
import { findFirstPartyClient, normalizeAllowedFirstPartyRedirect } from '~/utils/firstPartySsoContract'
import { getFirstPartyClients } from '@/server/utils/firstPartySso'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const query = getQuery(event)
  const client = findFirstPartyClient(getFirstPartyClients(), query.client_id)
  if (!client) {
    throw createError({ statusCode: 400, message: 'Unknown first-party client.' })
  }

  const redirectUri = normalizeAllowedFirstPartyRedirect(client, query.redirect_uri)
  if (!redirectUri) {
    throw createError({
      statusCode: 400,
      message: 'redirect_uri is not registered for this first-party client.',
    })
  }

  const googleClientId = String(process.env.GOOGLE_ID || '').trim()
  if (!googleClientId) {
    throw createError({ statusCode: 503, message: 'Google sign-in is not configured.' })
  }

  return {
    success: true,
    clientId: googleClientId,
    redirectUri,
  }
})
