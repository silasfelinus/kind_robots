//server/api/games/[id].join.post.ts
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

    const game = await prisma.game.findUnique({
      where: { id },
    })

    if (!game) {
      return { success: false, message: 'Game not found', statusCode: 404 }
    }

    const playerName = body.playerName

    if (!playerName) {
      return {
        success: false,
        message: 'Player name is required',
        statusCode: 400,
      }
    }

    // Append the player's name to the players string
    const updatedPlayers = game.players
      ? `${game.players},${playerName}`
      : playerName

    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        players: updatedPlayers,
      },
    })

    return { success: true, game: updatedGame }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
