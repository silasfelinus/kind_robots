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

    // Destructure fields from reactionData
    const { userId, artId, reaction, isLoved, isClapped, isBooed, isHated, title, comment } = reactionData

    // Validate required fields (userId and reaction are required)
    if (!userId || !reaction) {
      return {
        success: false,
        message: 'Missing required fields: userId or reaction.',
        statusCode: 400, // Bad Request
      }
    }

    // Create the new reaction in the database with relation handling
    const newReaction = await prisma.reaction.create({
      data: {
        reaction,
        isLoved: isLoved ?? false,
        isClapped: isClapped ?? false,
        isBooed: isBooed ?? false,
        isHated: isHated ?? false,
        title,
        comment,
        User: {
          connect: { id: userId }, // Connect to the existing user by userId
        },
        Art: artId ? { connect: { id: artId } } : undefined, // Optionally connect to an Art entity if artId is provided
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
