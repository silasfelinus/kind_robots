import { createError, defineEventHandler, setHeaders, setResponseStatus } from 'h3'

// The Vercel arm this used to carry is gone with the deployment: `VERCEL` is
// never set on the container, so it only ever selected a host that no longer
// serves the callback. GOOGLE_REDIRECT_URI still overrides for local work.
function getGoogleRedirectUri() {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    'https://kindrobots.org/api/auth/google/callback'
  )
}

export default defineEventHandler((event) => {
  const clientId = process.env.GOOGLE_ID

  if (!clientId) {
    throw createError({
      statusCode: 500,
      message: 'Google OAuth client ID is not configured',
    })
  }

  const redirectUri = getGoogleRedirectUri()
  const googleOAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email%20profile`

  setResponseStatus(event, 302)
  setHeaders(event, { Location: googleOAuthURL })
})
