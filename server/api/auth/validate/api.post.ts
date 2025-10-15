// src/api/auth/validate/api.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { validateApiKey, getUserByApiKey } from '..' // add this helper if you have it

export default defineEventHandler(async (event) => {
  console.log('validating by API key...')
  try {
    const { apiKey } = await readBody(event)
    if (!apiKey) throw new Error('API key is required for validation.')

    const isApiKeyValid = await validateApiKey(apiKey)

    if (!isApiKeyValid) {
      return { success: false, message: 'Invalid API key.' }
    }

    // optional: resolve the user behind this key so ChatGPT can scope writes
    const user = await getUserByApiKey?.(apiKey) // or however you look this up
    return user?.id
      ? { success: true, message: 'API key is valid.', data: { id: user.id } }
      : { success: true, message: 'API key is valid.' }
  } catch (error) {
    const { message } = errorHandler(error)
    return { success: false, message: `Validation error: ${message}` }
  }
})