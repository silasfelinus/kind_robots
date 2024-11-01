import { defineEventHandler, createError, readBody } from 'h3'
import { fetchBotByName, updateBot } from '../../bots'
import { verifyJwtToken } from '../../auth'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const name = String(event.context.params?.name)

  // Validate bot name
  if (!name) {
    return { success: false, message: 'Invalid bot name.', statusCode: 400 }
  }

  try {
    // Extract and validate JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Fetch the bot from the database
    const bot = await fetchBotByName(name)
    if (!bot) {
      throw createError({
        statusCode: 404,
        message: `Bot with name "${name}" not found.`,
      })
    }

    // Verify ownership of the bot
    if (bot.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this bot.',
      })
    }

    // Read the body data
    const data = await readBody(event)
    if (!data || Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update only the provided fields
    const updatedBot = await updateBot(name, data)
    return { success: true, bot: updatedBot, statusCode: 200 } // Success response with statusCode 200
  } catch (error: unknown) {
    console.error(
      `Failed to update bot with name "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message || `Failed to update bot with name "${name}".`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
