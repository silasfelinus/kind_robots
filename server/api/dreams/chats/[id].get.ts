// server/api/dreams/chats/[id].get.ts
import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const dreamId = Number(event.context.params?.id)
  const query = getQuery(event)
  const limit = query.limit ? Number(query.limit) : undefined

  if (isNaN(dreamId)) {
    setResponseStatus(event, 400)
    return { success: false, message: 'Invalid dream ID' }
  }

  // Verify parent dream exists
  const dream = await prisma.dream.findUnique({
    where: { id: dreamId },
  })

  if (!dream) {
    setResponseStatus(event, 404)
    return { success: false, message: 'Dream not found' }
  }

  // If private, require auth
  if (!dream.isPublic) {
    const authHeader = event.node.req.headers['authorization']
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      setResponseStatus(event, 401)
      return { success: false, message: 'Authentication required' }
    }

    const user = await prisma.user.findFirst({ where: { apiKey: token } })
    if (!user) {
      setResponseStatus(event, 401)
      return { success: false, message: 'Invalid token' }
    }

    if (user.id !== dream.userId) {
      setResponseStatus(event, 403)
      return { success: false, message: 'Access denied' }
    }
  }

  const chats = await prisma.chat.findMany({
    where: { dreamId },
    orderBy: { createdAt: 'asc' },
    ...(limit ? { take: limit } : {}),
  })

  return { success: true, message: 'Chats fetched successfully', data: chats }
})
