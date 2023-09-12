import { ServerResponse } from 'http'
import { defineEventHandler } from 'h3'

interface GoogleTokenResponse {
  access_token?: string
  refresh_token?: string
  error_description?: string
  error?: string
}

export default defineEventHandler(async (event) => {
  try {
    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.GOOGLE_REDIRECT_URI
    ) {
      throw new Error('Google environment variables are not set')
    }

    const url = new URL(event.req.url!, `http://${event.req.headers.host}`)
    const code = url.searchParams.get('code')

    if (!code || typeof code !== 'string') {
      throw new TypeError('Invalid authorization code')
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    })

    const data: GoogleTokenResponse = await response.json()

    if (data.error) {
      throw new Error(data.error_description || 'Unknown error')
    }

    // Here, save the access and refresh tokens to your Prisma database
    // ...

    // Redirect to a page in your app with a success message
    redirect(event.res, '/google-success')
  } catch (error) {
    console.error('Error in Google authentication:', error)
    // Redirect to a page in your app with an error message
    redirect(event.res, '/google-error')
  }
})

function redirect(res: ServerResponse, location: string) {
  res.writeHead(302, { Location: location })
  res.end()
}
