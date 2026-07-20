// /server/api/todos/[id].delete.ts
import { defineEventHandler, createError, getRouterParam } from 'h3'
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

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Todo deleted.',
      data: null,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to delete Todo.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
