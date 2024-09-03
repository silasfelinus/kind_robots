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
    return await prisma.Reaction.create({
      data: {
        userId: reaction.userId,
        artId: reaction.artId,
        claps: reaction.claps || 0,
        boos: reaction.boos || 0,
        title: reaction.title || null,
        reaction: reaction.reaction || null,
        comment: reaction.comment || null,
      },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

export async function updateReaction(
  id: number,
  updatedReaction: Partial<Reaction>,
): Promise<Reaction | null> {
  try {
    const existingRecord = await prisma.Reaction.findUnique({
      where: { id },
    })
    if (!existingRecord) {
      throw new Error('Record to update not found.')
    }
    return await prisma.Reaction.update({
      where: { id },
      data: updatedReaction,
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to delete an Reaction by ID
export async function deleteReaction(id: number): Promise<boolean> {
  try {
    const reactionExists = await prisma.Reaction.findUnique({
      where: { id },
    })

    if (!reactionExists) {
      return false
    }

    await prisma.$transaction([prisma.Reaction.delete({ where: { id } })])
    return true
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
// Function to fetch all Reactions
export async function fetchAllReactions(): Promise<Reaction[]> {
  return await prisma.Reaction.findMany()
}

// Function to fetch a single Reaction by ID
export async function fetchReactionById(
  id: number,
): Promise<Reaction | null> {
  return await prisma.Reaction.findUnique({
    where: { id },
  })
}

// Function to fetch Reactions by Art ID
export async function fetchReactionsByArtId(
  artId: number,
): Promise<Reaction[]> {
  return await prisma.Reaction.findMany({
    where: { artId },
  })
}

export type { Reaction }
