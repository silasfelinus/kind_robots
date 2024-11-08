// /server/api/pitches/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'
import type { Prisma, Pitch } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Use validateApiKey to authenticate
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Read and validate pitch data from the request body
    const pitchData = await readBody<Partial<Pitch>>(event)

    // Ensure required "pitch" field is provided and is a string
    if (!pitchData.pitch || typeof pitchData.pitch !== 'string') {
      event.node.res.statusCode = 400
      return {
        success: false,
        data: null,
        message: 'The "pitch" field is required and must be a string.',
      }
    }

    // Prepare the pitch data
    const data: Prisma.PitchCreateInput = {
      User: { connect: { id: authenticatedUserId } },
      pitch: pitchData.pitch,
      title: pitchData.title || null,
      designer: pitchData.designer || null,
      flavorText: pitchData.flavorText || null,
      highlightImage: pitchData.highlightImage || null,
      PitchType: pitchData.PitchType || 'ARTPITCH',
      isMature: pitchData.isMature ?? false,
      isPublic: pitchData.isPublic ?? true,
      imagePrompt: pitchData.imagePrompt || null,
      description: pitchData.description || null,
      examples: pitchData.examples || null,
      artImageId: pitchData.artImageId || null,
    }

    // Create the pitch and set status code to 201 for successful creation
    const createdPitch = await prisma.pitch.create({ data })
    event.node.res.statusCode = 201

    return {
      success: true,
      data: createdPitch,
      message: 'Pitch created successfully.',
    }
  } catch (error: unknown) {
    // Use errorHandler to standardize error response
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      data: null,
      message: message || 'Failed to create pitch.',
    }
  }
})
