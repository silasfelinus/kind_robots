// server/api/games/[id].patch.ts
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

    // Only allow specific fields to be updated
    const allowedFields = {
      descriptor: body.descriptor,
      category: body.category,
      isFinished: body.isFinished,
      winner: body.winner,
    }

    const filteredData = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, v]) => v !== undefined),
    )

    const updatedGame = await prisma.game.update({
      where: { id },
      data: filteredData,
    })

    return { success: true, game: updatedGame }
  } catch (error: unknown) {
    console.error('Update Game Error:', error)
    return errorHandler(error)
  }
})
