// /server/api/user/index.ts
// this functions are responsible for anything to do with the current user.
import { fetchUserById } from './../users/'

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  if (!userId) {
    return { success: false, message: 'User not authenticated' }
  }
  const user = await fetchUserById(userId)
  return { success: true, user }
})
