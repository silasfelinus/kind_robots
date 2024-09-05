// /server/api/reactions/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '..//utils/error'
import prisma from '../utils/prisma'
import type { Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate and parse the reaction ID from the URL params
    const id = Number(event.context.params?.id)
    if (!id || isNaN(id)) {
      throw new Error('Invalid or missing reaction ID.')
    }

    // Parse the incoming request body
    const updatedReactionData: Partial<Reaction> = await readBody(event)
    if (!updatedReactionData || Object.keys(updatedReactionData).length === 0) {
      throw new Error('No valid reaction data provided.')
    }

    // Fetch the existing reaction to ensure it exists
    const existingReaction = await prisma.reaction.findUnique({ where: { id } })
    if (!existingReaction) {
      return { success: false, message: 'Reaction not found.' }
    }

    // Update the reaction in the database
    const updatedReaction = await prisma.reaction.update({
      where: { id },
      data: updatedReactionData,
    })

    // Return the updated reaction
    return { success: true, reaction: updatedReaction }

  } catch (error: unknown) {
    // Handle errors consistently
    return errorHandler(error)
  }
})

// Utility function for updating a reaction
export async function updateReaction(
  id: number,
  updatedReactionData: Partial<Reaction>,
): Promise<Reaction | null> {
  try {
    return await prisma.reaction.update({
      where: { id },
      data: updatedReactionData,
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
