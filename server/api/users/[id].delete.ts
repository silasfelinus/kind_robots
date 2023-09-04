import { deleteUser } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) return { success: false, message: 'Invalid User ID.' }

  try {
    const deleted = await deleteUser(id)
    if (!deleted) return { success: false, message: `User with id ${id} does not exist.` }

    return { success: true, message: `User with id ${id} successfully deleted.` }
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to delete User with id ${id}. Reason: ${error.message}`
    }
  }
})
