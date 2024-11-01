// /server/api/pitches/[id]/patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Pitch } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Parse and validate the pitch ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid pitch ID.',
      })
    }

    // Extract and validate the JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Fetch the existing pitch to verify ownership
    const existingPitch = await prisma.pitch.findUnique({ where: { id } })
    if (!existingPitch) {
      throw createError({
        statusCode: 404,
        message: 'Pitch not found.',
      })
    }

    // Verify ownership of the pitch
    if (existingPitch.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this pitch.',
      })
    }

    // Parse the incoming request body as partial pitch data
    const pitchData: Partial<Pitch> = await readBody(event)
    if (!pitchData || Object.keys(pitchData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the pitch in the database
    const updatedPitch = await updatePitch(id, pitchData)

    // Return the updated pitch
    return {
      success: true,
      pitch: updatedPitch,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || `Failed to update pitch with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

// Function to update an existing Pitch by ID
export async function updatePitch(
  id: number,
  updatedPitch: Partial<Pitch>,
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
