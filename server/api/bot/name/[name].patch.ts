// server/api/bots/name/[name].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let response
  const name = String(event.context.params?.name)

  try {
    // Validate bot name
    if (!name) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid bot name. The name parameter is required.',
      })
    }

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch the bot by name and verify ownership
    const bot = await prisma.bot.findUnique({
      where: { name },
      select: { userId: true },
    })
    if (!bot) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Bot with name "${name}" not found.`,
      })
    }

    if (bot.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this bot.',
      })
    }

    // Read and validate update data
    const botData = await readBody(event)
    if (!botData || Object.keys(botData).length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the bot in the database
    const updatedBot = await prisma.bot.update({
      where: { name },
      data: botData,
    })

    // Successful update response
    response = {
      success: true,
      bot: updatedBot,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error updating bot by name:', handledError)

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update bot with name "${name}".`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
