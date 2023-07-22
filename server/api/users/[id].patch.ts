import { User } from '@prisma/client'
import prisma from '../utils/prisma'

const updateuserData = (user: Partial<User>): Partial<User> => {
  let data: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(user)) {
    if (value !== undefined) {
      data[key] = value
    }
  }

  return data as Partial<User>
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const id = Number(event.context.params?.id)

    if (!id) {
      throw new Error('Missing ID parameter.')
    }

    // Fetch the user from the database
    let user = await prisma.user.findUnique({ where: { id } })

    if (!user) {
      throw new Error('user not found.')
    }

    // Update only the provided fields
    const updatedUser = await prisma.user.update({
      where: {
        id
      },
      data: updateuserData(body)
    })
    return updatedUser
  } catch (error) {
    let errorMessage = 'An error occurred while updating the user.'

    // Check if error is an instance of Error
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage
    })
  }
})
