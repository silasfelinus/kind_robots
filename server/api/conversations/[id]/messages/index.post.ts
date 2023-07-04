// server/api/messages/post.ts
import prisma from '../../../prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const requiredFields = ['content', 'role', 'type', 'conversationId']

    for (const field of requiredFields) {
      if (!body[field]) {
        throw new Error(`Missing data. Please make sure to provide ${field}.`)
      }
    }

    const message = await prisma.message.create({
      data: {
        content: body.content,
        role: body.sender,
        type: body.type,
        tokenCount: body.tokenCount,
        conversationId: body.conversationId
      }
    })

    return message
  } catch (error) {
    let errorMessage = 'An error occurred while creating the message.'

    // Check if error is an instance of Error
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage
    })
  }
})
