// src/api/auth/token.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { fetchUserById } from '../../users'
import { verifyJwtToken } from '..'

export default defineEventHandler(async (event) => {
  console.log('validating by token...')
  try {
    const { token } = await readBody(event)
    if (!token) {
      throw new Error('Token is required for token validation.')
    }

    // Check if the token structure is valid (should have two dots for three parts)
    if (token.split('.').length !== 3) {
      console.log('Invalid token format')
      return {
        success: false,
        message: 'Token format is invalid.',
      }
    }

    const verificationResult = await verifyJwtToken(token)
    if (verificationResult && verificationResult.userId) {
      const data = await fetchUserById(verificationResult.userId)
      if (data) {
        console.log('Token validation succeeded.')
        return {
          success: true,
          message: 'Token is valid.',
          data,
        }
      }
    }
    console.log('Token validation failed.')
    return {
      success: false,
      message: 'Invalid token or user not found.',
    }
  } catch (error) {
    const { message } = errorHandler(error)
    return { success: false, message: `Validation error: ${message}` }
  }
})
