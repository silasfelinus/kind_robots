//server/api/auth/google/callback.ts
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
  sub: string // Google ID
  email: string
  email_verified: boolean
  name: string
  picture: string
}

export default defineEventHandler(async (event) => {
  const { code } = getQuery(event)

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Authorization code is missing',
    })
  }

  const clientId = process.env.GOOGLE_ID
  const clientSecret = process.env.GOOGLE_SECRET
  const redirectUri = 'https://kind-robots.vercel.app/api/auth/google/callback'

  try {
    // Exchange the code for a token
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

    // Fetch user info from Google
    const userInfo = await $fetch<GoogleUserInfoResponse>(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    )

    const { email, sub: googleId, name, picture } = userInfo

    if (!email) {
      throw createError({ statusCode: 400, message: 'Email is required' })
    }

    // Check if the user exists
    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // If the user doesn't exist, create a new one
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
    }

    // Generate a token for the user
    const jwt = await createToken(user)

    // Redirect the user to the dashboard with the token
    return sendRedirect(event, `/auth/google?token=${jwt}`)
  } catch (error) {
    console.error('Error during Google OAuth callback:', error)
    throw createError({ statusCode: 500, message: 'Internal Server Error' })
  }
})
