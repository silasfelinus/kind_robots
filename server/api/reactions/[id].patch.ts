// /server/api/reactions/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate and parse the reaction ID from the URL params
    const id = Number(event.context.params?.id)
    if (!id || isNaN(id)) {
      return {
        success: false,
        message: 'Invalid or missing reaction ID.',
        statusCode: 400, // Bad Request
      }
    }

    // Parse the incoming request body
    const updatedReactionData: Partial<Reaction> = await readBody(event)
    if (!updatedReactionData || Object.keys(updatedReactionData).length === 0) {
      return {
        success: false,
        message: 'No valid reaction data provided.',
        statusCode: 400, // Bad Request
      }
    }

    // Fetch the existing reaction to ensure it exists
    const existingReaction = await prisma.reaction.findUnique({ where: { id } })
    if (!existingReaction) {
      return { success: false, message: 'Reaction not found.', statusCode: 404 }
    }

    // Update the reaction in the database
    const updatedReaction = await prisma.reaction.update({
      where: { id },
      data: updatedReactionData,
    })

    // Return the updated reaction
    return { success: true, reaction: updatedReaction, statusCode: 200 }
  } catch (error: unknown) {
    // Use the errorHandler to process and log the error
    return errorHandler(error)
  }
})
