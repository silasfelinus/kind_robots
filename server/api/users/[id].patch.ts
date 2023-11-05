import { type User } from '@prisma/client'
import { hashPassword, validatePassword } from '../auth'
import { errorHandler } from '../utils/error'
import auth from '../../middleware/auth'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
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

export async function updateUser(id: number, data: Partial<User>): Promise<User | null> {
  try {
    return await prisma.user.update({
      where: { id },
      data
    })
  } catch (error: any) {
    console.error(`Failed to update user: ${error.message}`)
    throw new Error(errorHandler(error).message)
  }
}

export async function fetchUserById(id: number): Promise<Partial<User> | null> {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        Role: true,
        username: true,
        emailVerified: true,
        clickRecord: true,
        matchRecord: true,
        name: true,
        bio: true,
        birthday: true,
        city: true,
        state: true,
        country: true,
        timezone: true,
        avatarImage: true,
        karma: true,
        mana: true
      }
    })
  } catch (error: any) {
    console.error(`Failed to fetch user by ID: ${error.message}`)
    throw new Error(errorHandler(error).message)
  }
}
