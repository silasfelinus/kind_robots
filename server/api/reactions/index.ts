import { ArtReaction, Prisma } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Function to create a new ArtReaction
export async function createArtReaction(reaction: Partial<ArtReaction>) {
  try {
    // Validate required fields
    if (!reaction.userId || !reaction.artId) {
      throw new Error('UserId and ArtId must be provided')
    }

    // Create the new ArtReaction
    return await prisma.artReaction.create({
      data: {
        userId: reaction.userId,
        artId: reaction.artId,
        claps: reaction.claps || 0,
        boos: reaction.boos || 0,
        title: reaction.title || null,
        reaction: reaction.reaction || null,
        comment: reaction.comment || null
      }
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}

export async function updateArtReaction(
  id: number,
  updatedReaction: Partial<ArtReaction>
): Promise<ArtReaction | null> {
  try {
    const existingRecord = await prisma.artReaction.findUnique({ where: { id } })
    if (!existingRecord) {
      throw new Error('Record to update not found.')
    }
    return await prisma.artReaction.update({
      where: { id },
      data: updatedReaction
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to delete an ArtReaction by ID
export async function deleteArtReaction(id: number): Promise<boolean> {
  try {
    const reactionExists = await prisma.artReaction.findUnique({ where: { id } })

    if (!reactionExists) {
      return false
    }

    await prisma.$transaction([prisma.artReaction.delete({ where: { id } })])
    return true
  } catch (error: any) {
    throw errorHandler(error)
  }
}
// Function to fetch all ArtReactions
export async function fetchAllArtReactions(): Promise<ArtReaction[]> {
  return await prisma.artReaction.findMany()
}

// Function to fetch a single ArtReaction by ID
export async function fetchArtReactionById(id: number): Promise<ArtReaction | null> {
  return await prisma.artReaction.findUnique({
    where: { id }
  })
}

// Function to fetch ArtReactions by Art ID
export async function fetchArtReactionsByArtId(artId: number): Promise<ArtReaction[]> {
  return await prisma.artReaction.findMany({
    where: { artId }
  })
}

export type { ArtReaction }
