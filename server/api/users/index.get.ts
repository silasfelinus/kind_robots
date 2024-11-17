// /server/api/users/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchUsers } from '.'

export default defineEventHandler(async (event) => {
  

  try {
    

    // Fetch users with pagination logic
    const fetchResponse = await fetchUsers()

    // Ensure users is an array in the response
    const data = Array.isArray(fetchResponse.users) ? fetchResponse.users : []

    return {
      success: fetchResponse.success,
      message: fetchResponse.message || 'Users fetched successfully.',
      data, // Only `users` array is returned
      statusCode: 200,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    console.error('Failed to fetch users:', handledError.message)
    return {
      success: false,
      message: `Failed to fetch users. Reason: ${handledError.message}`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
