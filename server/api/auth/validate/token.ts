// /server/api/auth/validate/token.ts
import { defineEventHandler, getHeader, readBody } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'
import { verifyJwtToken } from '..'

type TokenValidationBody = {
  token?: string
}

function cleanBearerToken(value?: string | null): string {
  const token = value?.trim() || ''

  return token.replace(/^Bearer\s+/i, '').trim()
}

function getAuthorizationToken(event: Parameters<typeof getHeader>[0]): string {
  const authorization = getHeader(event, 'authorization')

  return cleanBearerToken(authorization)
}

async function readTokenBody(event: Parameters<typeof readBody>[0]) {
  try {
    const body = await readBody<TokenValidationBody | undefined>(event)

    return body && typeof body === 'object' ? body : {}
  } catch {
    return {}
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readTokenBody(event)

    const token = cleanBearerToken(body.token) || getAuthorizationToken(event)

    if (!token) {
      return {
        success: false,
        message: 'Token is required for token validation.',
        statusCode: 400,
      }
    }

    if (token.split('.').length !== 3) {
      return {
        success: false,
        message:
          'Token format is invalid. Expected a JWT with three dot-separated parts.',
        statusCode: 400,
      }
    }

    const verificationResult = await verifyJwtToken(token)

    if (!verificationResult.success || !verificationResult.userId) {
      return {
        success: false,
        message: verificationResult.message || 'Invalid token.',
        statusCode: verificationResult.statusCode ?? 403,
      }
    }

    const data = await prisma.user.findUnique({
      where: {
        id: verificationResult.userId,
      },
    })

    if (!data) {
      return {
        success: false,
        message: 'Token is valid, but the user was not found.',
        statusCode: 404,
      }
    }

    return {
      success: true,
      message: 'Token is valid.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    return {
      success: false,
      message: `Validation error: ${message}`,
      statusCode: statusCode || 500,
    }
  }
})
