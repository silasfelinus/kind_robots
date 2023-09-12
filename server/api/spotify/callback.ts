import { defineEventHandler } from 'h3'

interface SpotifyTokenResponse {
  access_token?: string
  refresh_token?: string
  error_description?: string
  error?: string
}

export default defineEventHandler(async (event) => {
  try {
    if (
      !process.env.SPOTIFY_CLIENT_ID ||
      !process.env.SPOTIFY_CLIENT_SECRET ||
      !process.env.SPOTIFY_REDIRECT_URI
    ) {
      throw new Error('Spotify environment variables are not set')
    }

    const url = new URL(event.req.url!, `http://${event.req.headers.host}`)
    const code = url.searchParams.get('code')

    if (!code || typeof code !== 'string') {
      throw new TypeError('Invalid authorization code')
    }

    const verifier = url.searchParams.get('code_verifier')
    if (!verifier || typeof verifier !== 'string') {
      throw new TypeError('Invalid code verifier')
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        code_verifier: verifier
      })
    })

    const data: SpotifyTokenResponse = await response.json()

    if (data.error || !data.access_token || !data.refresh_token) {
      throw new Error(data.error_description || 'Unknown error')
    }

    // Here, save the access and refresh tokens to your Prisma database
    // ...

    return {
      status: 200,
      body: JSON.stringify({
        message: 'Authentication successful',
        data
      }),
      headers: { 'Content-Type': 'application/json' }
    }
  } catch (error: any) {
    console.error('Error in Spotify authentication:', error)
    return {
      status: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    }
  }
})
