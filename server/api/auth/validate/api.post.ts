// src/api/auth/validate/api.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '..'

export default defineEventHandler(async (event) => {
  console.log('validating by API key...')
  try {
    const { apiKey } = await readBody(event)
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
  } catch (error) {
    const { message } = errorHandler(error)
    return { success: false, message: `Validation error: ${message}` }
  }
})
