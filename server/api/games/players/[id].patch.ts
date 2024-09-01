// server/api/games/players/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

// Define the type for the data being updated
interface PlayerUpdateData {
  status?: 'WAITING' | 'CHOOSING' | 'FINISHED' | 'PLAYING'
  avatarImage?: string
  userId?: number
  points?: number
  artId?: number
}

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const body = await readBody<PlayerUpdateData>(event)

    if (isNaN(id)) {
      return { success: false, message: 'Invalid Player ID', statusCode: 400 }
    }

    // Build the update data object based on the body
    const updateData: PlayerUpdateData = {}

    if (body.status) {
      updateData.status = body.status
    }

    if (body.avatarImage) {
      updateData.avatarImage = body.avatarImage
    }

    if (body.userId !== undefined) {
      updateData.userId = body.userId
    }

    if (body.points !== undefined) {
      updateData.points = body.points
    }

    if (body.artId !== undefined) {
      updateData.artId = body.artId
    }

    // Update the player in the database
    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: updateData,
    })

    return { success: true, player: updatedPlayer }
  } catch (error: unknown) {
    console.error('Update Player Error:', error)
    return errorHandler(error)
  }
})
