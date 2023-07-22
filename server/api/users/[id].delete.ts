// server/api/users/[id].delete.ts
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    // Fetch the user from the database
    const user = await prisma.user.findUnique({ where: { id: Number(id) } })

    if (!user) {
      throw new Error('user not found.')
    }

    // Delete the user
    await prisma.user.delete({ where: { id } })
    return { message: `user with id ${id} successfully deleted.` }
  } catch (error) {
    let errorMessage = 'An error occurred while deleting the user.'

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
