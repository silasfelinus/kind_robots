// server/api/conversations/[id].get.ts
import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: Number(id)
    }
  })
  if (!conversation) {
    const notFoundError = createError({
      statusCode: 404,
      statusMessage: 'conversation not found '
    })
    sendError(event, notFoundError)
  }
  return conversation
})
