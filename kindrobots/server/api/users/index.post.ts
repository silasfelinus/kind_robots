import { addUser } from '.'

export default defineEventHandler(async (event) => {
  try {
    const UsersData = await readBody(event)
    const result = await addUser(UsersData)
    return { success: true, ...result }
  } catch (error) {
    return { success: false, message: 'failed to create a new User' }
  }
})
