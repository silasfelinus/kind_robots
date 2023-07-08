// server/api/conversations/post.ts
import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  const channel = event.context.body?.channel

  if (!channel) {
    const badRequestError = createError({
      statusCode: 400,
      statusMessage: 'channel is required'
    })
    sendError(event, badRequestError)
  }

  const conversation = await prisma.conversation.create({
    data: {
      channel
    }
  })

  return conversation
})
