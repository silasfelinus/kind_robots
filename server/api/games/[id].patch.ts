//server/api/games/[id].patch.ts
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

    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        ...body, // Update the fields sent in the request body
      },
    })

    return { success: true, game: updatedGame }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
