// server/api/messages/post.ts
import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  const { content, role, covnersationlId, conversation } = event.context.body

  if (!content || !role || !conversation || !conversation) {
    const badRequestError = createError({
      statusCode: 400,
      statusMessage: 'Content, role, and conversationId are required'
    })
    sendError(event, badRequestError)
  }

  const message = await prisma.message.create({
    data: {
      content,
      role,
      conversation,
      conversationId
    }
  })

  return message
})
