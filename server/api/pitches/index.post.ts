// /server/api/pitches/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error' // Import the error handler
import prisma from './../utils/prisma'
import type { Prisma, Pitch } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const pitchData = await readBody(event)

    // Check if pitchData is an array or a single object
    const result = Array.isArray(pitchData)
      ? await addPitches(pitchData) // Handle multiple pitches
      : await addPitch(pitchData) // Handle a single pitch

    return { success: true, ...result }
  } catch (error) {
    // Use the error handler to process the error
    const { message, statusCode } = errorHandler(error)

    // Return the error response with the processed message and status code
    return {
      success: false,
      message: 'Failed to create a new pitch',
      error: message,
      statusCode: statusCode || 500, // Default to 500 if no status code is provided
    }
  }
})

// Function to add a single pitch
export async function addPitch(
  pitchData: Partial<Pitch>,
): Promise<{ pitch: Pitch | null; error: string | null }> {
  if (!pitchData.pitch) {
    return { pitch: null, error: 'Pitch content is required.' }
  }

  try {
    const pitch = await prisma.pitch.create({
      data: pitchData as Prisma.PitchCreateInput,
    })
    return { pitch, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { pitch: null, error: errorMessage }
  }
}

// Function to handle adding multiple pitches
export async function addPitches(
  pitchesData: Partial<Pitch>[],
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
        data: pitchData as Prisma.PitchCreateInput,
      })
      createdPitches.push(pitch)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      errors.push(errorMessage)
    }
  }

  if (errors.length > 0) {
    return {
      pitches: createdPitches.length > 0 ? createdPitches : null,
      error: errors.join(', '), // Combine all error messages into one string
    }
  }

  return { pitches: createdPitches, error: null }
}
