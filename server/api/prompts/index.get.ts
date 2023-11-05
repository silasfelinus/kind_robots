// server/api/art/prompts/index.get.ts
import { defineEventHandler } from 'h3'
import { type ArtPrompt, type Art } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  try {
    const artPrompts = await fetchAllArtPrompts()
    return { success: true, artPrompts }
  } catch (error: any) {
    return errorHandler(error)
  }
})

// Fetch all ArtPrompts along with their related Art
export async function fetchAllArtPrompts(): Promise<(ArtPrompt & { Art: Art[] })[]> {
  try {
    return await prisma.artPrompt.findMany({
      include: {
        Art: true // Include related Art
      }
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}
