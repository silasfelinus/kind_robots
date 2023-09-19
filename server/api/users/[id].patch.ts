import { hashPassword, validatePassword } from '../auth'
import { errorHandler } from '../utils/error'
import auth from '../../middleware/auth'
import { fetchUserById, updateUser } from '.'

export default defineEventHandler(async (event) => {
  console.log('[id].patch API route invoked. Setting auth to true.')
  event.context.route = { auth: true }
  auth(event)

  const id = Number(event.context.params?.id)
  if (!id) {
    console.error('Invalid User ID.')
    throw new Error('Invalid User ID.')
  }

  try {
    console.log(`Fetching user by ID: ${id}`)
    const user = await fetchUserById(id)
    const data = await readBody(event)

    if (!user) {
      console.error('User not found.')
      throw new Error('User not found.')
    }

    console.log('User found, checking for password update.')

    let hashedPassword
    if (data.password) {
      const passwordValidation = validatePassword(data.password)
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message)
      }
      hashedPassword = await hashPassword(data.password)
    }

    // Destructure the password field from the data object to avoid updating it directly
    const { password, ...restData } = data

    // If a hashed password is generated, add it to the data to be updated
    if (hashedPassword) {
      restData.password = hashedPassword
    }

    // Log the data to be updated in User model
    console.log('Updating the following fields in User model:', JSON.stringify(restData, null, 2))

    // Update only the provided fields in User model
    const updatedUser = await updateUser(id, restData)

    console.log('User update successful.')
    return { success: true, user: updatedUser }
  } catch (error: any) {
    console.error('Full error:', JSON.stringify(error, null, 2)) // Log the full error
    return {
      success: false,
      message: `Failed to update User with id ${id}. Reason: ${errorHandler(error).message}` // Updated to correctly extract message
    }
  }
})
