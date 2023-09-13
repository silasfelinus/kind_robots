import { validateUserCredentials } from '.' // Adjust the path accordingly

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = await readBody(event)

    const result = await validateUserCredentials(username, password)
    if (result) {
      return { success: true, user: result.user, token: result.token }
    } else {
      throw new Error('Invalid credentials')
    }
  } catch (error: any) {
    console.error(error)
    return { success: false, message: error.message }
  }
})
