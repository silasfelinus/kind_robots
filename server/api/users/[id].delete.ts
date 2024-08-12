// server/api/users/[id].delete.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import auth from '../../middleware/auth'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    console.log('id.delete API route invoked. Setting auth to true.')
    
    // Validate the API key using the auth middleware
    event.context.route = { auth: true } // This line sets the auth property
    auth(event)

    // Extract and validate the user ID
    const id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      return { success: false, message: 'Invalid User ID.' }
    }

    // Attempt to delete the user
    const deleted = await deleteUser(id)
    if (!deleted) {
      return { success: false, message: `User with id ${id} does not exist.` }
    }

    return { success: true, message: `User with id ${id} successfully deleted.` }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { response: 'Unauthorized', statusCode: 401 }
    }
    const { message } = errorHandler(error)
    return {
      success: false,
      message: `Failed to delete User. Reason: ${message}`,
    }
  }
})

export async function deleteUser(id: number): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      console.error(`User with id ${id} does not exist.`)
      return false
    }

    await prisma.user.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    console.error(`Failed to delete user: ${(error as Error).message}`)
    throw new Error(errorHandler(error).message)
  }
}

