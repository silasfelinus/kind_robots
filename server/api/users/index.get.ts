// /server/api/users/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import auth from '../../middleware/auth'
import prisma from '../utils/prisma'
import { fetchUsers } from '.'

export default defineEventHandler(async (event) => {
  console.log('index.get API route invoked. Setting auth to true.')
  event.context.route = { auth: true } // This line sets the auth property

  try {
    auth(event)
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 100
    const users = await fetchUsers()
    return { success: true, users }
  }
  catch (error: any) {
    console.error('Failed to fetch users:', error.message) // Log the error message for debugging
    return { success: false, message: `Failed to fetch users. Reason: ${errorHandler(error)}` }
  }
})
