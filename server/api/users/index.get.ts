// server/api/users/index.get.ts
import auth from '../user/auth'
import { fetchUsers } from '.'

export default defineEventHandler(async (event) => {
  console.log('index.get API route invoked. Setting auth to true.')
  event.context.route = { auth: true } // This line sets the auth property

  try {
    auth(event)
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 100
    const Users = await fetchUsers(page, pageSize)
    return { success: true, Users }
  } catch (error: any) {
    return { success: false, message: 'Failed to fetch Users.', error: error.message }
  }
})
