// server/api/users/[id].delete.ts
import { deleteUser } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid User ID.')
  try {
    const deleted = await deleteUser(id)
    if (!deleted) throw new Error(`User with id ${id} does not exist.`)
    return { success: true, message: `User with id ${id} successfully deleted.` }
  } catch (error) {
    return { success: false, message: `Failed to delete User with id ${id}.` }
  }
})
