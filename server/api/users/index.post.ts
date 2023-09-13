import { errorHandler } from '../utils/error'
import auth from '../../middleware/auth'
import { createUserWithAuth, createUserWithUsername, createUserWithEmail } from '.'

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

    // Validate the userData before proceeding
    if (!userData.username && !userData.email) {
      throw new Error('Username or email is required.')
    }
    if (userData.password && userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long.')
    }

    // Determine which function to call based on the data received
    if (userData.username && !userData.email && !userData.password) {
      console.log('Calling createUserWithUsername with username:', userData.username)
      result = await createUserWithUsername(userData.username)
    } else if (!userData.username && userData.email && !userData.password) {
      console.log('Calling createUserWithEmail with email:', userData.email)
      result = await createUserWithEmail(userData.email)
    } else if (userData.username && userData.password && userData.email) {
      console.log(
        'Calling createUserWithAuth with username, password, and email:',
        userData.username,
        userData.password,
        userData.email
      )
      result = await createUserWithAuth(userData.username, userData.password, userData.email)
    } else {
      throw new Error('Invalid user data.')
    }
    if (!result.success) {
      throw new Error(
        typeof result.message === 'string' ? result.message : 'An unexpected error occurred.'
      )
    }

    console.log('Add user result:', result) // Debugging line

    return { success: true, user: result.user } // Only take the user field from result
  } catch (error: any) {
    console.error('Error in adding user:', error.message) // Debugging line
    const { message } = errorHandler(error)
    return { success: false, message: `Failed to create a new user: ${message}` }
  }
})
