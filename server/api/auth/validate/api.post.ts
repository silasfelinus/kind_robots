// server/api/auth/validate/api.post.ts
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

    const result = await validateApiKey(apiKey)

    if (!result.success) {
      return { success: false, message: result.message || 'Invalid API key.' }
    }

    // If validateApiKey found a user, return it in a standard shape ChatGPT can consume
    if (result.user?.id) {
      return {
        success: true,
        message: 'API key is valid.',
        data: { id: result.user.id }, // <- important: exposes userId to the adapter
      }
    }

    // Valid key, but no user returned (rare with your current impl)
    return { success: true, message: 'API key is valid.' }
  } catch (error) {
    const { message } = errorHandler(error)
    return { success: false, message: `Validation error: ${message}` }
  }
})