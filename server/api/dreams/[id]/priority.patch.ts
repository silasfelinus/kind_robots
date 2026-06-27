import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    if (auth.user.Role !== 'ADMIN') throw createError({ statusCode: 403, message: 'Admin only' })

    const rawId = getRouterParam(event, 'id')
    const id = parseInt(rawId ?? '', 10)
    if (!id || id <= 0) throw createError({ statusCode: 400, message: 'Invalid dream id' })

    const { priority } = await readBody<{ priority: string }>(event)
    if (!['LOW', 'NORMAL', 'HIGH'].includes(priority)) {
      throw createError({ statusCode: 400, message: 'priority must be LOW, NORMAL, or HIGH' })
    }

    await prisma.$executeRaw`UPDATE \`Dream\` SET priority = ${priority} WHERE id = ${id}`

    return { success: true, message: `Priority set to ${priority}.` }
  } catch (error) {
    return errorHandler(error)
  }
})
