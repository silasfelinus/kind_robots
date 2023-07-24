// server/api/users/[id].get.ts
import { fetchUserById } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid User ID.')
  try {
    const User = await fetchUserById(id)

    if (!User) {
      throw new Error(`User with id ${id} does not exist.`)
    }

    return { success: true, User }
  } catch (error) {
    return { success: false, message: `Failed to fetch User with id ${id}.` }
  }
})
