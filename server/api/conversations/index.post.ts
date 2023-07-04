// server/api/conversations/post.ts
import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const requiredFields = ['messages']

    for (const field of requiredFields) {
      if (!body[field]) {
        throw new Error(`Missing data. Please make sure to provide ${field}.`)
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        messages: {
          create: body.messages
        }
      },
      include: {
        messages: true
      }
    })

    return conversation
  } catch (error) {
    let errorMessage = 'An error occurred while creating the conversation.'

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
