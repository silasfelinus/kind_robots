import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract componentId from the route parameters
    const componentId = Number(event.context.params?.id)
    if (!componentId) {
      throw new Error('Component ID is required.')
    }

    // Parse the request body to get the reaction updates
    const body = await readBody(event)
    const { isLoved, isBooed, isClapped, isHated, userId } = body

    // Ensure that userId is provided
    if (!userId) {
      throw new Error('User ID is required to update the reaction.')
    }

    // Update the reaction record in the database for the given component and user
    const updatedReaction = await prisma.reaction.updateMany({
      where: {
        componentId,
        userId,
      },
      data: {
        isLoved,
        isBooed,
        isClapped,
        IsHated: isHated,
      },
    })

    if (!updatedReaction) {
      throw new Error(`Failed to update reaction for component with ID ${componentId}.`)
    }

    return {
      success: true,
      updatedReaction,
    }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
