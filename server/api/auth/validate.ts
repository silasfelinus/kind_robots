import { errorHandler } from '../utils/error'
import { validateUserCredentials, verifyJwtToken, validateApiKey, getUserDataByToken } from '.' // replace with the actual path to your auth file

export default defineEventHandler(async (event) => {
  try {
    const { type, data } = await readBody(event)
    console.log('Incoming Event:', type, data)

    // Validate input data
    if (!type || !data) {
      throw new Error('Validation type and data are required.')
    }

    if (type === 'credentials') {
      const { username, password } = data
      if (!username || !password) {
        throw new Error('Username and password are required for credentials validation.')
      }

      const validationResponse = await validateUserCredentials(username, password)
      if (validationResponse) {
        return {
          success: true,
          message: '🚀 Credentials are valid. You are good to go!',
          data: validationResponse
        }
      } else {
        return { success: false, message: '🚀 Mission abort! Invalid username or password.' }
      }
    } else if (type === 'token') {
      const { token } = data
      if (!token) {
        throw new Error('Token is required for token validation.')
      }
      console.log('Something happened, I do not know if it was the right thing')
      const isTokenValid = await verifyJwtToken(token)

      if (isTokenValid) {
        const userData = await getUserDataByToken(token)

        return {
          success: true,
          message: '🚀 Token is valid. You are good to go!',
          user: userData
        }
      } else {
        console.log('User Token InValidated)')
        return { success: false, message: '🚀 Mission abort! Invalid token.' }
      }
    } else if (type === 'apiKey') {
      const { apiKey } = data
      if (!apiKey) {
        throw new Error('API key is required for API key validation.')
      }

      const isApiKeyValid = await validateApiKey(apiKey)
      if (isApiKeyValid) {
        return { success: true, message: '🚀 API key is valid. You are good to go!' }
      } else {
        return { success: false, message: '🚀 Mission abort! Invalid API key.' }
      }
    } else {
      return { success: false, message: '🚀 Mission abort! Invalid validation type.' }
    }
  } catch (error: any) {
    const { message } = errorHandler(error)
    return { success: false, message: `🚀 Mission abort! ${message}` }
  }
})
