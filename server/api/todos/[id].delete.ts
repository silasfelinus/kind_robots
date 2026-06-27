// /server/api/todos/[id].delete.ts
import { defineEventHandler, createError, getRouterParam, H3Error } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const userId = auth.user.id

    const rawId = getRouterParam(event, 'id')
    const id = parseInt(rawId ?? '', 10)
    if (!id || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid todo id' })
    }

    const result = await prisma.$executeRaw`
      DELETE FROM \`Todo\` WHERE id = ${id} AND userId = ${userId}
    `

    if (!result) {
      throw createError({ statusCode: 404, message: 'Todo not found' })
    }

    return { success: true, message: 'Todo deleted.' }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
