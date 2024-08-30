// server/api/games/[id]/updatePoints.post.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const gameId = Number(event.context.params?.id)
    const body = await readBody(event)

    if (isNaN(gameId)) {
      return { success: false, message: 'Invalid Game ID', statusCode: 400 }
    }

    const { playerName, points } = body

    if (!playerName || typeof points !== 'number') {
      return {
        success: false,
        message: 'Player name and points are required',
        statusCode: 400,
      }
    }

    const player = await prisma.player.updateMany({
      where: {
        gameId,
        name: playerName,
      },
      data: {
        points,
      },
    })

    if (player.count === 0) {
      return { success: false, message: 'Player not found in the game', statusCode: 404 }
    }

    return { success: true, message: 'Player points updated successfully' }
  } catch (error: unknown) {
    console.error('Update Player Points Error:', error)
    return errorHandler(error)
  }
})
