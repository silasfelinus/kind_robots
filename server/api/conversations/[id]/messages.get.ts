// server/api/conversations/[id]/messages.get.ts
import prisma from '../../prisma'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const conversation = await prisma.conversation.findUnique({
    where: { id }
  })

  if (!conversation) {
    const notFoundError = createError({
      statusCode: 404,
      statusMessage: 'Conversation not found'
    })
    sendError(event, notFoundError)
    return // We need to ensure we stop further execution when conversation is not found.
  }

  // If we reach this line, conversation is not null, so it's safe to return its messages.
  return conversation
})
