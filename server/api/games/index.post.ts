// server/api/games/index.post.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const newGame = await prisma.game.create({
      data: {
        descriptor: body.descriptor,
        category: body.category || "Blue Sky Tasks",
        creator: body.creator,
        isPrivate: body.isPrivate || false,
      },
    })

    return { success: true, game: newGame }
  } catch (error: unknown) {
    console.error('Create Game Error:', error)
    return errorHandler(error)
  }
})
