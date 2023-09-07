import auth from '../user/auth'
import { deleteUser } from '.' // Make sure this import is correct

export default async (event: any) => {
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
      message: `Failed to delete User. Reason: ${error.message}`
    }
  }
}
