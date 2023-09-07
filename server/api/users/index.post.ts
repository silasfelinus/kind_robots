// server/api/users/index.post.ts
import auth from '../user/auth'
import { createUserWithUsername, createUserWithEmail, createUserWithAuth } from '.'

export default defineEventHandler(async (event) => {
  console.log('index.post API route invoked. Setting auth to true.')

  // Initialize event.context.route if it's undefined
  if (!event.context.route) {
    event.context.route = {}
  }

  event.context.route.auth = true // Now, this should work

  try {
    auth(event)
    const userData = await readBody(event)
    console.log('Received user data:', userData) // Debugging line

    let result

    // Determine which function to call based on the data received
    if (userData.username && !userData.email && !userData.password) {
      result = await createUserWithUsername(userData.username)
    } else if (!userData.username && userData.email && !userData.password) {
      result = await createUserWithEmail(userData.email)
    } else if (userData.username && userData.password && userData.email) {
      result = await createUserWithAuth(userData.username, userData.email, userData.password)
    } else if (userData.username && !userData.email && userData.password) {
      result = await createUserWithAuth(userData.username, userData.password, null)
    } else {
      throw new Error('Invalid user data.')
    }

    if (!result.success) {
      throw new Error(result.message)
    }

    console.log('Add user result:', result) // Debugging line

    return { success: true, user: result.user } // Only take the user field from result
  } catch (error: any) {
    console.error('Error in adding user:', error.message) // Debugging line
    return { success: false, message: `Failed to create a new user: ${error.message}` }
  }
})
