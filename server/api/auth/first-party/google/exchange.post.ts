import { createError, defineEventHandler, readBody, setHeader } from 'h3'
import prisma from '@/server/utils/prisma'
import { logSafeError } from '@/server/utils/error'
import { getFirstPartyClients } from '@/server/utils/firstPartySso'
import {
  findFirstPartyClient,
  normalizeAllowedFirstPartyRedirect,
  validatePkceVerifier,
} from '~/utils/firstPartySsoContract'

type ExchangeBody = {
  client_id?: unknown
  redirect_uri?: unknown
  code?: unknown
  code_verifier?: unknown
}

type GoogleTokenResponse = {
  access_token?: string
}

type GoogleUserInfoResponse = {
  sub?: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

async function reserveGoogleUsername(name: string, googleId: string): Promise<string> {
  const cleanName = name.trim().slice(0, 220)
  const base = cleanName || `user-${googleId.slice(0, 8)}`

  for (let attempt = 0; attempt < 20; attempt++) {
    const suffix = attempt === 0 ? '' : `-${googleId.slice(0, 6)}${attempt === 1 ? '' : `-${attempt}`}`
    const candidate = `${base.slice(0, 255 - suffix.length)}${suffix}`
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    })
    if (!existing) return candidate
  }

  return `user-${googleId.slice(0, 20)}`
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'Pragma', 'no-cache')

  const body = await readBody<ExchangeBody>(event)
  const client = findFirstPartyClient(getFirstPartyClients(), body?.client_id)
  if (!client) {
    throw createError({ statusCode: 400, message: 'Unknown first-party client.' })
  }

  const redirectUri = normalizeAllowedFirstPartyRedirect(client, body?.redirect_uri)
  if (!redirectUri) {
    throw createError({
      statusCode: 400,
      message: 'redirect_uri is not registered for this first-party client.',
    })
  }

  const code = typeof body?.code === 'string' ? body.code.trim() : ''
  const verifier = validatePkceVerifier(body?.code_verifier)
  if (!code || !verifier) {
    throw createError({
      statusCode: 400,
      message: 'A valid Google authorization code and PKCE verifier are required.',
    })
  }

  const googleClientId = String(process.env.GOOGLE_ID || '').trim()
  const googleClientSecret = String(process.env.GOOGLE_SECRET || '').trim()
  if (!googleClientId || !googleClientSecret) {
    throw createError({ statusCode: 503, message: 'Google sign-in is not configured.' })
  }

  try {
    const tokenResponse = await $fetch<GoogleTokenResponse>(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        body: {
          code,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: verifier,
        },
      },
    )

    const accessToken = String(tokenResponse.access_token || '').trim()
    if (!accessToken) {
      throw createError({
        statusCode: 401,
        message: 'Google did not return an access token.',
      })
    }

    const googleUser = await $fetch<GoogleUserInfoResponse>(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    const email = String(googleUser.email || '').trim().toLowerCase()
    const googleId = String(googleUser.sub || '').trim()
    if (!email || !googleId || googleUser.email_verified !== true) {
      throw createError({
        statusCode: 403,
        message: 'A verified Google email address is required.',
      })
    }

    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      const username = await reserveGoogleUsername(
        String(googleUser.name || ''),
        googleId,
      )
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          username,
          avatarImage: String(googleUser.picture || '').trim() || null,
          emailVerified: new Date(),
        },
      })
    } else {
      if (user.isActive === false) {
        throw createError({
          statusCode: 403,
          message: 'The Kind Robots account is unavailable.',
        })
      }

      const update: {
        googleId?: string
        emailVerified?: Date
        avatarImage?: string
      } = {}
      if (!user.googleId) update.googleId = googleId
      if (!user.emailVerified) update.emailVerified = new Date()
      if (!user.avatarImage && googleUser.picture) {
        update.avatarImage = googleUser.picture
      }

      if (Object.keys(update).length) {
        user = await prisma.user.update({ where: { id: user.id }, data: update })
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    }
  } catch (error) {
    logSafeError('[First-party Google exchange] failed:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({
      statusCode: 401,
      message: 'Google sign-in could not be completed.',
    })
  }
})
