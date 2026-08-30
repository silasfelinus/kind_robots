import {
  defineEventHandler,
  getQuery,
  sendRedirect,
  setHeader,
} from 'h3'
import {
  getKindSessionIdentity,
  issueFirstPartyAuthorizationCode,
  parseFirstPartyAuthorizeRequest,
} from '@/server/utils/firstPartySso'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'Pragma', 'no-cache')

  const request = parseFirstPartyAuthorizeRequest(
    getQuery(event) as Record<string, unknown>,
  )
  const identity = await getKindSessionIdentity(event)

  if (!identity) {
    const rawRequestPath = event.node.req.url || '/api/auth/first-party/authorize'
    const returnTo = rawRequestPath.startsWith('/') && !rawRequestPath.startsWith('//')
      ? rawRequestPath
      : '/api/auth/first-party/authorize'

    return await sendRedirect(
      event,
      `/login?returnTo=${encodeURIComponent(returnTo)}`,
      302,
    )
  }

  const grant = await issueFirstPartyAuthorizationCode({
    userId: identity.id,
    clientId: request.client.id,
    redirectUri: request.redirectUri,
    codeChallenge: request.codeChallenge,
  })

  const destination = new URL(request.redirectUri)
  destination.searchParams.set('code', grant.code)
  destination.searchParams.set('state', request.state)

  return await sendRedirect(event, destination.toString(), 302)
})
