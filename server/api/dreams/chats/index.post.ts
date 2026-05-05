// server/api/dreams/chats/index.post.ts
import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
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

  const body = await readBody(event)

  if (!body?.content) {
    setResponseStatus(event, 400)
    return { success: false, message: 'Missing required field: content' }
  }

  const dreamId = Number(body.dreamId)
  if (!dreamId || isNaN(dreamId)) {
    setResponseStatus(event, 400)
    return { success: false, message: 'Missing required field: dreamId' }
  }

  const dream = await prisma.dream.findUnique({ where: { id: dreamId } })
  if (!dream) {
    setResponseStatus(event, 404)
    return { success: false, message: 'Dream not found' }
  }

  const chat = await prisma.chat.create({
    data: {
      dreamId,
      userId: user.id,
      type: body.type ?? 'Dream',
      sender: body.sender ?? null,
      content: body.content,
      botResponse: body.botResponse ?? null,
      isPublic: body.isPublic ?? true,
      isMature: body.isMature ?? false,
    },
  })

  if (body.updateDream) {
    const patch: Record<string, unknown> = {}
    if (body.currentVibe !== undefined) patch.currentVibe = body.currentVibe
    if (body.currentPrompt !== undefined)
      patch.currentPrompt = body.currentPrompt

    if (Object.keys(patch).length > 0) {
      await prisma.dream.update({ where: { id: dreamId }, data: patch })
    }
  }

  setResponseStatus(event, 201)
  return { success: true, message: 'Chat created successfully', data: chat }
})
