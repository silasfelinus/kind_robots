// server/api/conversations/[channel].get.ts
import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  const channel = event.context.params?.channel
  const conversations = await prisma.conversation.findMany({
    where: {
      channel
    }
  })

  if (conversations.length === 0) {
    const notFoundError = createError({
      statusCode: 404,
      statusMessage: 'No channels found for this conversation'
    })
    sendError(event, notFoundError)
  }

  return conversations
})
