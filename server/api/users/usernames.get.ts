// /server/api/users/usernames.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchUsers } from '.'

export default defineEventHandler(async () => {
  try {
    const response = await fetchUsers()

    // Default to an empty array if `users` is missing or not an array
    const users = Array.isArray(response.users) ? response.users : []
    const usernames = users.map((user) => user.username).filter(Boolean) // Filter out undefined or null usernames

    return {
      success: true,
      message: 'Usernames fetched successfully.',
      data: { usernames }, // Ensure `data.usernames` structure
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Failed to fetch usernames:', handledError.message)

    return {
      success: false,
      message: `Failed to fetch usernames. Reason: ${handledError.message}`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
