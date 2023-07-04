// server/api/messages/[id].get.ts
import prisma from '../../../prisma'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const message = await prisma.message.findUnique({
    where: {
      id: Number(id)
    }
  })
  if (!message) {
    const notFoundError = createError({
      statusCode: 404,
      statusMessage: 'message not found '
    })
    sendError(event, notFoundError)
  }
  return message
})
