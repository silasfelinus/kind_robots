import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const challenge = String(event.context.params?.challenge)
    if (!challenge) {
      return new Response(null, { status: 400, statusText: 'Challenge parameter is missing' })
    }

    const redirectUri = process.env.REDIRECT_URI
    const clientId = process.env.SPOTIFY_CLIENT_ID

    if (!redirectUri || !clientId) {
      throw new Error('Environment variables REDIRECT_URI or SPOTIFY_CLIENT_ID are not set')
    }

    const authorizeUrl = new URL('https://accounts.spotify.com/authorize')
    authorizeUrl.searchParams.append('client_id', clientId)
    authorizeUrl.searchParams.append('response_type', 'code')
    authorizeUrl.searchParams.append('redirect_uri', redirectUri)
    authorizeUrl.searchParams.append('code_challenge_method', 'S256')
    authorizeUrl.searchParams.append('code_challenge', challenge)
    authorizeUrl.searchParams.append('scope', 'user-read-playback-state user-modify-playback-state')

    return new Response(null, {
      status: 302,
      headers: {
        Location: authorizeUrl.toString()
      }
    })
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'An unknown error occurred', {
      status: 500
    })
  }
})
