//server/api/games/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const games = await prisma.game.findMany({
      include: {
        Users: true, // Include related Users
        Art: true, // Include related Art
        ArtPrompt: true, // Include related Art Prompts
      },
    })

    return { success: true, games }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
