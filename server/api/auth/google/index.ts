//server/api/auth/google/index.ts

import { defineEventHandler, setResponseStatus, setHeaders } from 'h3'

export default defineEventHandler((event) => {
  const clientId = process.env.GOOGLE_ID
  const redirectUri = 'https://kind-robots.vercel.app/dashboard'

  const googleOAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email%20profile`

  setResponseStatus(event, 302)
  setHeaders(event, { Location: googleOAuthURL })
})
