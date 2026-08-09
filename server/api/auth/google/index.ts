import { createError, defineEventHandler, setHeaders, setResponseStatus } from 'h3'

function getGoogleRedirectUri() {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    (process.env.VERCEL
      ? 'https://kind-robots.vercel.app/api/auth/google/callback'
      : 'https://kindrobots.org/api/auth/google/callback')
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
