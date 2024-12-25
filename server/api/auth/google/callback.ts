import { defineEventHandler, getQuery, sendRedirect } from 'h3'
import prisma from '../../utils/prisma' // Adjust the path to your Prisma utility

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
  given_name: string
  family_name: string
  locale: string
}

export default defineEventHandler(async (event) => {
  const { code } = getQuery(event) // Extract the `code` parameter from the query string

  const clientId = process.env.GOOGLE_ID
  const clientSecret = process.env.GOOGLE_SECRET
  const redirectUri = 'https://kind-robots.vercel.app/api/auth/google/callback' // Update to match your deployment URL

  try {
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

    const userInfo = await $fetch<GoogleUserInfoResponse>(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    )

    const { sub: googleId, email, name, picture } = userInfo

    if (!email) {
      throw new Error('Google account does not provide an email address')
    }

    // Check if a user with the given email exists
    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      // If the user exists, link the Google account if not already linked
      if (!existingUser.googleId) {
        await prisma.user.update({
          where: { email },
          data: { googleId, googleEmail: email },
        })
      }

      // Redirect the user to the dashboard or callback with token
      return sendRedirect(
        event,
        `/dashboard?token=${existingUser.token}&status=linked`,
      )
    }

    // If no user exists, create a new one
    const newUser = await prisma.user.create({
      data: {
        username: name || `user-${googleId.substring(0, 8)}`, // Generate fallback username if name is unavailable
        email,
        googleId,
        googleEmail: email,
        avatarImage: picture,
      },
    })

    // Redirect the user to the dashboard or callback with token
    return sendRedirect(
      event,
      `/dashboard?token=${newUser.token}&status=created`,
    )
  } catch (error) {
    console.error('Google Authentication Error:', error)
    return {
      success: false,
      message: 'Authentication failed',
    }
  }
})
