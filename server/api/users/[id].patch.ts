// /server/api/users/[id].patch.ts
import { fetchUserById, updateUser } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid User ID.')
  try {
    // Fetch the User from the database
    const User = await fetchUserById(id)

    // Make sure to await the Promise returned by readBody
    const data = await readBody(event)

    if (!User) {
      throw new Error('User not found.')
    }

    // Update only the provided fields
    const updatedUser = await updateUser(id, data)

    return { success: true, User: updatedUser }
  } catch (error) {
    return { success: false, message: `Failed to update User with id ${id}.` }
  }
})
