// ~/server/api/users/index.post.ts
import { addUser } from '.'

export default defineEventHandler(async (event) => {
  try {
    const userData = await readBody(event)
    console.log('Received user data:', userData) // Debugging line

    const result = await addUser(userData)
    console.log('Add user result:', result) // Debugging line

    return { success: true, ...result }
  } catch (error: any) {
    console.error('Error in adding user:', error.message) // Debugging line
    return { success: false, message: `Failed to create a new user: ${error.message}` }
  }
})
