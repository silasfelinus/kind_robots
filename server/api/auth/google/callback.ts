import { defineEventHandler, getQuery, sendRedirect, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { createToken, generateApiKey } from '..'

interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope: string
  token_type: string
  id_token?: string
}

interface GoogleUserInfoResponse {
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture: string
}

export default defineEventHandler(async (event) => {
  const { code } = getQuery(event)
  console.log('[Google Callback] Handler entered', { hasCode: !!code })

  if (!code) {
    console.error('[Google Callback] ❌ No authorization code in query')
    throw createError({
      statusCode: 400,
      message: 'Authorization code is missing',
    })
  }

  const clientId = process.env.GOOGLE_ID
  const clientSecret = process.env.GOOGLE_SECRET
  const redirectUri = 'https://kind-robots.vercel.app/api/auth/google/callback'

  console.log('[Google Callback] Env check', {
    clientId: clientId ? '✅ present' : '❌ MISSING',
    clientSecret: clientSecret ? '✅ present' : '❌ MISSING',
  })

  try {
    console.log('[Google Callback] Exchanging code for token...')
    const tokenResponse = await $fetch<GoogleTokenResponse>(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        body: {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        },
      },
    )

    const { access_token } = tokenResponse
    console.log('[Google Callback] Token exchange success', {
      hasAccessToken: !!access_token,
    })

    console.log('[Google Callback] Fetching Google user info...')
    const userInfo = await $fetch<GoogleUserInfoResponse>(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } },
    )

    const { email, sub: googleId, name, picture } = userInfo
    console.log('[Google Callback] User info received', {
      email,
      googleId,
      name,
      hasPicture: !!picture,
    })

    if (!email) {
      console.error('[Google Callback] ❌ No email returned from Google')
      throw createError({ statusCode: 400, message: 'Email is required' })
    }

    let user = await prisma.user.findUnique({ where: { email } })
    console.log('[Google Callback] DB lookup result', {
      userFound: !!user,
      userId: user?.id,
    })

    if (!user) {
      console.log('[Google Callback] Creating new user for', email)
      const apiKey = generateApiKey()
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          username: name || `user-${googleId.substring(0, 8)}`,
          avatarImage: picture,
          apiKey,
        },
      })
      console.log('[Google Callback] New user created', {
        userId: user.id,
        username: user.username,
      })
    }

    console.log('[Google Callback] Generating JWT for user', {
      userId: user.id,
    })
    const jwt = await createToken(user)
    console.log('[Google Callback] JWT generated, length:', jwt.length)

    const redirectTarget = `/auth/google?token=${jwt}`
    console.log(
      '[Google Callback] Redirecting to:',
      redirectTarget.substring(0, 40) + '...[token]',
    )

    return sendRedirect(event, redirectTarget)
  } catch (error) {
    console.error('[Google Callback] ❌ Fatal error:', error)
    throw createError({ statusCode: 500, message: 'Internal Server Error' })
  }
})
