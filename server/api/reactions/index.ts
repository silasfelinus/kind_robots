import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Define your enums directly in the code for validation
enum ReactionType {
  LOVED = 'LOVED',
  CLAPPED = 'CLAPPED',
  BOOED = 'BOOED',
  HATED = 'HATED',
  NEUTRAL = 'NEUTRAL',
  FLAGGED = 'FLAGGED',
}

// Define the type for requestData
interface RequestData {
  userId: number
  reactionType: string // Allow string input from client
  artId?: number
  componentId?: number
  pitchId?: number
  channelId?: number
  comment?: string
}

// Map string input to the ReactionType enum
function mapReactionType(type: string): ReactionType | undefined {
  const normalizedType = type.toUpperCase() as keyof typeof ReactionType
  return ReactionType[normalizedType]
}

// Route handler for creating or updating a reaction
export default defineEventHandler(async (event) => {
  let requestData: RequestData | undefined

  try {
    requestData = await readBody(event)

    // Ensure requestData is defined
    if (!requestData) throw new Error('Invalid request data.')

    const {
      userId,
      reactionType, // reactionType is a string to be normalized
      artId,
      componentId,
      pitchId,
      channelId,
      comment,
    } = requestData

    // Ensure required fields are present
    if (!userId || !reactionType) {
      throw new Error('Missing required fields: userId or reactionType.')
    }

    // Map reactionType string to the enum value
    const mappedReactionType = mapReactionType(reactionType)
    if (!mappedReactionType) throw new Error('Invalid reactionType provided.')

    // Define match condition based on reaction type
    const matchCondition: { [key: string]: number | undefined } = {}
    if (artId) {
      matchCondition.artId = artId
    } else if (componentId) {
      matchCondition.componentId = componentId
    } else if (pitchId) {
      matchCondition.pitchId = pitchId
    } else if (channelId) {
      matchCondition.channelId = channelId
    } else {
      throw new Error('Invalid or missing identifier for reaction.')
    }

    // Check if a reaction already exists for this user and reaction type
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId,
        reactionType: mappedReactionType,
        ...matchCondition,
      },
    })

    if (existingReaction) {
      // Update the existing reaction
      const updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: {
          comment,
          reactionType: mappedReactionType,
        },
      })
      return { success: true, reaction: updatedReaction, message: 'Reaction updated successfully' }
    } else {
      // Create a new reaction
      const newReaction = await prisma.reaction.create({
        data: {
          userId,
          reactionType: mappedReactionType,
          ...matchCondition,
          comment,
        },
      })
      return { success: true, reaction: newReaction, message: 'Reaction created successfully' }
    }
  } catch (error) {
    return errorHandler({
      error,
      context: 'Reaction Management - POST',
    })
  }
})

// Function to fetch all Reactions
export async function fetchAllReactions() {
  try {
    return await prisma.reaction.findMany({
      include: {
        Art: true, // Include related Art data if needed
        Pitch: true, // Include related Pitch data if needed
        Component: true, // Include related Component data if needed
        Channel: true, // Include related Channel data if needed
      },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

export const deleteReaction = async (reactionId: number): Promise<boolean> => {
  try {
    // Check if the reaction exists before attempting to delete it
    const reaction = await prisma.reaction.findUnique({
      where: { id: reactionId },
    })

    if (!reaction) {
      throw new Error(`Reaction with ID ${reactionId} not found.`)
    }

    // Delete the reaction
    await prisma.reaction.delete({
      where: { id: reactionId },
    })

    // If deletion is successful, return true
    return true
  } catch (error) {
    console.error(`Error deleting reaction with ID ${reactionId}:`, error)
    return false
  }

}

// Function to fetch a single Reaction by ID
export async function fetchReactionById(id: number) {
  try {
    const reaction = await prisma.reaction.findUnique({
      where: { id },
      include: {
        Art: true, // Include related Art data if needed
        Pitch: true, // Include related Pitch data if needed
        Component: true, // Include related Component data if needed
        Channel: true, // Include related Channel data if needed
      },
    })

    if (!reaction) {
      throw new Error(`Reaction with ID ${id} not found`)
    }

    return reaction
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}