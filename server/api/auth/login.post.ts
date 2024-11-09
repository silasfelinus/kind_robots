import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchUserById } from '../users'
import { validateUserCredentials, verifyJwtToken, validateApiKey } from '.'

export default defineEventHandler(async (event) => {
  try {
    const { type, data } = await readBody(event)
    if (!type || !data) {
      throw new Error('Validation type and data are required.')
    }

    switch (type) {
      case 'credentials': {
        const { username, password } = data
        if (!username || !password) {
          throw new Error(
            'Both username and password must be provided for credentials validation.',
          )
        }
        const validationResponse = await validateUserCredentials(
          username,
          password,
        )

        if (validationResponse) {
          return {
            success: true,
            message: 'Credentials are valid.',
            data: { ...validationResponse },
          }
        } else {
          return {
            success: false,
            message: 'Invalid username or password.',
          }
        }
      }

      case 'token': {
        const { token } = data
        if (!token) {
          throw new Error('Token is required for token validation.')
        }
        const verificationResult = await verifyJwtToken(token)

        if (verificationResult && verificationResult.userId) {
          const userData = await fetchUserById(verificationResult.userId)
          if (userData) {
            return {
              success: true,
              message: 'Token is valid.',
              data: { ...userData, token }, // Spread user data and include token
            }
          }
        }
        return {
          success: false,
          message: 'Invalid token or user not found.',
        }
      }

      case 'apiKey': {
        const { apiKey } = data
        if (!apiKey) {
          throw new Error('API key is required for validation.')
        }
        const isApiKeyValid = await validateApiKey(apiKey)

        return isApiKeyValid
          ? {
              success: true,
              message: 'API key is valid.',
            }
          : {
              success: false,
              message: 'Invalid API key.',
            }
      }

      default:
        return {
          success: false,
          message: 'Invalid validation type provided.',
        }
    }
  } catch (error) {
    const { message } = errorHandler(error)
    return { success: false, message: `Validation error: ${message}` }
  }
})
