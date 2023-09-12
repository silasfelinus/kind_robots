// /api/utils/spotifyApi.ts

interface SpotifyApiError {
  error: {
    message: string
  }
}

async function spotifyApi<T = unknown>(
  endpoint: string,
  accessToken: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, any>
): Promise<T> {
  try {
    const response = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const errorResponse: SpotifyApiError = await response.json()
      throw new Error(errorResponse.error.message)
    }

    const data: T = await response.json()
    return data
  } catch (error) {
    console.error('Spotify API call error:', error)
    throw error
  }
}

export default spotifyApi
