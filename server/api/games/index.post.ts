// server/api/games/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Create the new game
    const newGame = await prisma.game.create({
      data: {
        descriptor: body.descriptor,
        category: body.category,
        designer: body.designer,
        isPrivate: body.isPrivate,
      },
    })

    // Check if firstPlayer is provided and create the player
    if (body.firstPlayer) {
      await prisma.player.create({
        data: {
          name: body.firstPlayer.name,
          points: body.firstPlayer.points,
          userId: body.firstPlayer.userId,
          gameId: newGame.id, // Associate player with the newly created game
        },
      })
    }

    // Return the created game details
    return { success: true, game: newGame }
  } catch (error: unknown) {
    console.error('Create Game Error:', error)
    return errorHandler(error)
  }
})
