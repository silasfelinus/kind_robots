// /server/api/auth/validate/token.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'
import { verifyJwtToken } from '..'

export default defineEventHandler(async (event) => {
  try {
    const { token } = await readBody<{ token?: string }>(event)

    if (!token) {
      return {
        success: false,
        message: 'Token is required for token validation.',
      }
    }

    if (token.split('.').length !== 3) {
      return {
        success: false,
        message: 'Token format is invalid.',
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
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    return {
      success: false,
      message: `Validation error: ${message}`,
      statusCode,
    }
  }
})
