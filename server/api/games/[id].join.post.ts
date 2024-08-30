// server/api/games/[id]/join.post.ts
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
      include: {
        Players: true,
      },
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

    // Check if the player already exists in the game
    const existingPlayer = game.Players.find(
      (player) => player.name === playerName,
    )

    if (existingPlayer) {
      return {
        success: false,
        message: 'Player already in the game',
        statusCode: 400,
      }
    }

    // Create a new player entry and associate with the game
    const newPlayer = await prisma.player.create({
      data: {
        name: playerName,
        points: 0,
        gameId: id,
      },
    })

    return { success: true, player: newPlayer }
  } catch (error: unknown) {
    console.error('Join Game Error:', error)
    return errorHandler(error)
  }
})
