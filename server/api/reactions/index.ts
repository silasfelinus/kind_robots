import type { Reaction } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Function to create a new Reaction
export async function createReaction(reaction: Partial<Reaction>) {
  try {
    // Validate required fields
    if (!reaction.userId || !reaction.artId) {
      throw new Error('UserId and ArtId must be provided')
    }

    // Create the new Reaction
    return await prisma.reaction.create({
      data: {
        userId: reaction.userId,
        artId: reaction.artId,
        title: reaction.title || null,
        comment: reaction.comment || null,
        reaction: reaction.reaction || null,
        isLoved: reaction.isLoved || false,
        isClapped: reaction.isClapped || false,
        isBooed: reaction.isBooed || false,
        isHated: reaction.isHated || false,
        pitchId: reaction.pitchId || null,
        componentId: reaction.componentId || null,
        channelId: reaction.channelId || 1,
      },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to update a Reaction
export async function updateReaction(
  id: number,
  updatedReaction: Partial<Reaction>,
): Promise<Reaction | null> {
  try {
    const existingRecord = await prisma.reaction.findUnique({
      where: { id },
    })
    if (!existingRecord) {
      throw new Error('Record to update not found.')
    }

    return await prisma.reaction.update({
      where: { id },
      data: {
        title: updatedReaction.title || existingRecord.title,
        comment: updatedReaction.comment || existingRecord.comment,
        reaction: updatedReaction.reaction || existingRecord.reaction,
        isLoved:
          updatedReaction.isLoved !== undefined
            ? updatedReaction.isLoved
            : existingRecord.isLoved,
        isClapped:
          updatedReaction.isClapped !== undefined
            ? updatedReaction.isClapped
            : existingRecord.isClapped,
        isBooed:
          updatedReaction.isBooed !== undefined
            ? updatedReaction.isBooed
            : existingRecord.isBooed,
        isHated:
          updatedReaction.isHated !== undefined
            ? updatedReaction.isHated
            : existingRecord.isHated,
        userId: updatedReaction.userId || existingRecord.userId,
        artId: updatedReaction.artId || existingRecord.artId,
        pitchId: updatedReaction.pitchId || existingRecord.pitchId,
        componentId: updatedReaction.componentId || existingRecord.componentId,
        channelId: updatedReaction.channelId || existingRecord.channelId,
      },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to delete a Reaction by ID
export async function deleteReaction(id: number): Promise<boolean> {
  try {
    const reactionExists = await prisma.reaction.findUnique({
      where: { id },
    })

    if (!reactionExists) {
      return false
    }

    await prisma.reaction.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to fetch all Reactions
export async function fetchAllReactions(): Promise<Reaction[]> {
  try {
    return await prisma.reaction.findMany()
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to fetch a single Reaction by ID
export async function fetchReactionById(id: number): Promise<Reaction | null> {
  try {
    return await prisma.reaction.findUnique({
      where: { id },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to fetch Reactions by Art ID
export async function fetchReactionsByArtId(
  artId: number,
): Promise<Reaction[]> {
  try {
    return await prisma.reaction.findMany({
      where: { artId },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

export type { Reaction }
