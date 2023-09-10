// /server/api/user/username.ts
import { fetchUserById } from './../users/'

export default defineEventHandler(async (event) => {
  // Get the user ID from the event context
  const userId = event.context.user?.id

  // Check if the user is authenticated
  if (!userId) {
    return { success: false, message: 'User not authenticated 🚫' }
  }

  try {
    // Fetch the user details by ID
    const user = await fetchUserById(userId)

    // Check if the user object and username exist
    if (user && user.username) {
      return { success: true, user, username: user.username }
    } else {
      return { success: false, message: 'Username not found 🤷‍♀️' }
    }
  } catch (error: any) {
    // Handle any errors during the fetch operation
    return { success: false, message: `An error occurred: ${error.message} 😢` }
  }
})
