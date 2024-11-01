// /server/api/pitches/[id]/patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Prisma, Pitch } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let id: number | null = null
  let response

  try {
    // Parse and validate the pitch ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid pitch ID.',
      })
    }

    // Extract and validate the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch the existing pitch to verify ownership
    const existingPitch = await prisma.pitch.findUnique({ where: { id } })
    if (!existingPitch) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: 'Pitch not found.',
      })
    }

    // Verify ownership of the pitch
    if (existingPitch.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this pitch.',
      })
    }

    // Parse the incoming request body as partial pitch data
    const pitchData: Prisma.PitchUpdateInput = await readBody(event)
    if (!pitchData || Object.keys(pitchData).length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the pitch in the database
    const updatedPitch = await updatePitch(id, pitchData)

    // Successful response with updated pitch
    response = {
      success: true,
      pitch: updatedPitch,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update pitch with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// Function to update an existing Pitch by ID
export async function updatePitch(
  id: number,
  updatedPitch: Prisma.PitchUpdateInput,
): Promise<Pitch | null> {
  try {
    return await prisma.pitch.update({
      where: { id },
      data: updatedPitch,
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
