// server/api/games/[id]/leave.post.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const body = await readBody(event)

    if (isNaN(id)) {
      return { success: false, message: 'Invalid Game ID', statusCode: 400 }
    }

    const playerName = body.playerName

    if (!playerName) {
      return {
        success: false,
        message: 'Player name is required',
        statusCode: 400,
      }
    }

    // Find and delete the player from the game
    const player = await prisma.player.deleteMany({
      where: {
        gameId: id,
        name: playerName,
      },
    })

    if (player.count === 0) {
      return {
        success: false,
        message: 'Player not found in the game',
        statusCode: 404,
      }
    }

    return { success: true, message: 'Player removed from the game' }
  } catch (error: unknown) {
    console.error('Leave Game Error:', error)
    return errorHandler(error)
  }
})
