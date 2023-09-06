// ~/server/api/users/login.ts
import { validateUserCredentials } from '../users'

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = await readBody(event)
    const user = await validateUserCredentials(username, password)

    if (user) {
      // Generate a token or set a cookie here
      return { success: true, message: 'Login successful', user }
    } else {
      return { success: false, message: 'Invalid username or password' }
    }
  } catch (error: any) {
    return { success: false, message: `Login failed: ${error.message}` }
  }
})
