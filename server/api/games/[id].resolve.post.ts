// server/api/games/[id]/resolve.post.ts
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

    const winnerName = body.winnerName

    // Optionally find the player with the most points
    const winner =
      winnerName ||
      game.Players.reduce(
        (prev, curr) => (curr.points > prev.points ? curr : prev),
        game.Players[0],
      ).name

    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        isFinished: true,
        winner,
      },
    })

    return { success: true, game: updatedGame }
  } catch (error: unknown) {
    console.error('Resolve Game Error:', error)
    return errorHandler(error)
  }
})
