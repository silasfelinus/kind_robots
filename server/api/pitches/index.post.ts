// /server/api/pitches/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Pitch, Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
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
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Read and validate pitch data from the request body
    const pitchData = (await readBody(event)) as Partial<Pitch>

    // Ensure required "pitch" field is provided and is a string
    if (!pitchData.pitch || typeof pitchData.pitch !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'The "pitch" field is required and must be a string.',
      })
    }

    // Optional fields are assigned only if they exist
    const data: Prisma.PitchCreateInput = {
      User: { connect: { id: authenticatedUserId } }, // Connect user relation
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

    // Create the new pitch with the defined data
    const createdPitch = await prisma.pitch.create({
      data,
    })

    // Return success response
    return {
      success: true,
      data: createdPitch,
      message: 'Pitch created successfully.',
      statusCode: 201,
    }
  } catch (error: unknown) {
    // Capture specific error message and status code from errorHandler
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message,
      statusCode,
    }
  }
})
