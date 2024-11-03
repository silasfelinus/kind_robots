// /server/api/pitches/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, Pitch } from '@prisma/client'

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

    // Read and validate the pitch data from the request body
    const pitchData = await readBody(event)

    // Process single or multiple pitches with specific validation and error handling
    const result = Array.isArray(pitchData)
      ? await addPitches(pitchData, authenticatedUserId)
      : await addPitch(pitchData, authenticatedUserId)

    if (result.error) {
      return {
        success: false,
        message: result.error,
        statusCode: 400,
      }
    }

    // Set status code to 201 Created
    event.node.res.statusCode = 201
    return { success: true, ...result }
  } catch (error) {
    // Handle and return error response
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: 'Failed to create a new pitch.',
      error: message,
      statusCode: event.node.res.statusCode,
    }
  }
})

// Function to add a single pitch with validation and error handling
export async function addPitch(
  pitchData: Partial<Pitch>,
  userId: number,
): Promise<{ pitch: Pitch | null; error: string | null }> {
  if (!pitchData.pitch) {
    return { pitch: null, error: 'Pitch content is required.' }
  }

  try {
    const pitch = await prisma.pitch.create({
      data: { ...pitchData, userId } as Prisma.PitchCreateInput,
    })
    return { pitch, error: null }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred while creating the pitch.'
    return { pitch: null, error: errorMessage }
  }
}

// Function to handle adding multiple pitches with consolidated error handling
export async function addPitches(
  pitchesData: Partial<Pitch>[],
  userId: number,
): Promise<{ pitches: Pitch[] | null; error: string | null }> {
  const createdPitches: Pitch[] = []
  const errors: string[] = []

  for (const pitchData of pitchesData) {
    if (!pitchData.pitch) {
      errors.push('Pitch content is required.')
      continue
    }

    try {
      const pitch = await prisma.pitch.create({
        data: { ...pitchData, userId } as Prisma.PitchCreateInput,
      })
      createdPitches.push(pitch)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while creating a pitch.'
      errors.push(errorMessage)
    }
  }

  return {
    pitches: createdPitches.length > 0 ? createdPitches : null,
    error: errors.length > 0 ? errors.join('; ') : null,
  }
}
