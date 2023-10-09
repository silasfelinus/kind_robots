// server/api/users/[id].delete.ts
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
    if (!id) return { success: false, message: 'Invalid User ID.' }

    // Attempt to delete the user
    const deleted = await deleteUser(id)
    if (!deleted) return { success: false, message: `User with id ${id} does not exist.` }

    return { success: true, message: `User with id ${id} successfully deleted.` }
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return { response: 'Unauthorized', statusCode: 401 }
    }
    return {
      success: false,
      message: `Failed to delete User. Reason: ${errorHandler(error)}`
    }
  }
})

export async function deleteUser(id: number): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new Error(`User with id ${id} does not exist. Please provide a valid user ID.`)

    await prisma.user.delete({ where: { id } })
    return true
  } catch (error: any) {
    console.error(`Failed to delete user: ${error.message}`)
    throw new Error(errorHandler(error).message)
  }
}
