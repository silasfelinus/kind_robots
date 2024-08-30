// server/api/games/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const games = await prisma.game.findMany({
      include: {
        Players: true, // Include related players in each game
      },
    })

    return { success: true, games }
  } catch (error: unknown) {
    console.error('Get Games Error:', error)
    return errorHandler(error)
  }
})
