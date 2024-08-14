import type { User } from '@prisma/client'
import { defineEventHandler, readBody } from 'h3'
import { hashPassword, validatePassword } from '../auth'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) {
    console.error('Invalid User ID.')
    return {
      success: false,
      message: 'Invalid User ID.',
    }
  }

  try {
    console.log(`Fetching user by ID: ${id}`)
    const user = await fetchUserById(id)
    const data = await readBody(event)

    if (!user) {
      console.error('User not found.')
      return {
        success: false,
        message: 'User not found.',
      }
    }

    console.log('User found, checking for password update.')

    let hashedPassword: string | undefined
    if (data.password) {
      const passwordValidation = validatePassword(data.password)
      if (!passwordValidation.isValid) {
        console.error('Password validation failed:', passwordValidation.message)
        return {
          success: false,
          message: passwordValidation.message,
        }
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
    console.log(
      'Updating the following fields in User model:',
      JSON.stringify(restData, null, 2),
    )

    // Update only the provided fields in User model
    const updatedUser = await updateUser(id, restData)

    console.log('User update successful.')
    return { success: true, user: updatedUser }
  } catch (error) {
    const { message } = errorHandler(error)
    console.error('Failed to update user:', message)
    return {
      success: false,
      message: `Failed to update User with id ${id}. Reason: ${message}`,
    }
  }
})

export async function updateUser(
  id: number,
  data: Partial<User>,
): Promise<User | null> {
  try {
    return await prisma.user.update({
      where: { id },
      data,
    })
  } catch (error) {
    const { message } = errorHandler(error)
    console.error(`Failed to update user: ${message}`)
    throw new Error(message)
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
        mana: true,
      },
    })
  } catch (error) {
    const { message } = errorHandler(error)
    console.error(`Failed to fetch user by ID: ${message}`)
    throw new Error(message)
  }
}
