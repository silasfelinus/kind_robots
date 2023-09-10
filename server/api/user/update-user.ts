// /server/api/user/update-user.ts
import { updateUser } from './../users/'

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  const data = await readBody(event)
  if (!userId) {
    return { success: false, message: 'User not authenticated' }
  }
  const updatedUser = await updateUser(userId, data)
  return { success: !!updatedUser, user: updatedUser }
})
