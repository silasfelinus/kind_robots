// server/api/users/random.get.ts
import { randomUser } from '.'

export default defineEventHandler(async () => {
  try {
    const User = await randomUser()
    if (!User) {
      throw new Error(`No Users available.`)
    }
    return { success: true, User }
  } catch (error) {
    return { success: false, message: 'No User available' }
  }
})
