// server/api/reactions/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Parse the incoming request body
    const reactionData: Partial<Reaction> = await readBody(event)

    // Ensure the request body is valid
    if (!reactionData || Object.keys(reactionData).length === 0) {
      return {
        success: false,
        message: 'No reaction data provided.',
        statusCode: 400, // Bad Request
      }
    }

    // Validate required fields (userId, artId, reaction)
    const { userId, artId, reaction } = reactionData
    if (!userId || !artId || !reaction) {
      return {
        success: false,
        message: 'Missing required fields: userId, artId, or reaction.',
        statusCode: 400, // Bad Request
      }
    }

    // Create the new reaction in the database
    const newReaction = await prisma.reaction.create({
      data: {
        ...reactionData,
      },
    })

    // Return only the newly created reaction
    return {
      success: true,
      reaction: newReaction, // Only returning the created reaction
      statusCode: 201, // Created
    }
  } catch (error: unknown) {
    // Use the errorHandler to process and log the error
    return errorHandler(error)
  }
})
