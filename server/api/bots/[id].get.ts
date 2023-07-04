// server/api/bots/[id].get.ts
import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const bot = await prisma.bot.findUnique({
    where: {
      id: Number(id)
    }
  })
  if (!bot) {
    const notFoundError = createError({
      statusCode: 404,
      statusMessage: 'Bot not found '
    })
    sendError(event, notFoundError)
  }
  return bot
})
