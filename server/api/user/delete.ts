import { deleteUser } from './../users/'

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  if (!userId) {
    return { success: false, message: 'User not authenticated' }
  }
  const result = await deleteUser(userId)
  return { success: result }
})
