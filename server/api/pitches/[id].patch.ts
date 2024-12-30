import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let id: number | null = null
  let response

  try {
    // Parse and validate the pitch ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid pitch ID. It must be a positive integer.',
      })
    }

    // Use validateApiKey to authenticate
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch the existing pitch to verify ownership
    const existingPitch = await prisma.pitch.findUnique({
      where: { id },
    })
    if (!existingPitch) {
      throw createError({
        statusCode: 404,
        message: 'Pitch not found.',
      })
    }

    // Verify ownership of the pitch
    if (existingPitch.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this pitch.',
      })
    }

    // Parse the incoming request body as partial pitch data
    const pitchData: Prisma.PitchUpdateInput = await readBody(event)
    if (!pitchData || Object.keys(pitchData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the pitch in the database
    const data = await prisma.pitch.update({
      where: { id },
      data: pitchData,
    })

    // Successful response with updated pitch
    response = {
      success: true,
      message: 'Pitch updated successfully.',
      data,
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
