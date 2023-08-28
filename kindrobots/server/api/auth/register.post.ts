import { addUser } from '../users'

export default defineEventHandler(async (event) => {
  try {
    const userData = await readBody(event)
    const newUser = await addUser(userData)
    return { success: true, user: newUser }
  } catch (error: any) {
    return { success: false, message: 'Failed to register user.', error: error.message }
  }
})
