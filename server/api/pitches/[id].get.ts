import { defineEventHandler } from 'h3'
import type { Pitch, Art } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response

  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id)) {
      return {
        success: false,
        message: 'Invalid ID',
        statusCode: 400,
      }
    }

    // Fetch the pitch by ID and its related data
    const pitchDetails = await fetchPitchById(id)
    if (!pitchDetails) {
      return {
        success: false,
        message: 'Pitch not found',
        statusCode: 404,
      }
    }

    response = {
      success: true,
      message: 'Pitch details fetched successfully.',
      data: pitchDetails, // Return the pitch details under data
      statusCode: 200,
    }
    event.node.res.statusCode = response.statusCode
  } catch (error: unknown) {
    return errorHandler(error)
  }

  return response
})

export async function fetchPitchById(id: number): Promise<PitchDetails | null> {
  try {
    // Fetch the pitch by ID
    const pitch = await prisma.pitch.findUnique({
      where: { id },
    })

    if (!pitch) {
      return null
    }

    const [art] = await Promise.all([fetchArtByPitchId(id)])

    return { pitch, art }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    throw new Error(handledError.message)
  }
}

// Fetch Art related to the Pitch
async function fetchArtByPitchId(pitchId: number): Promise<Art[]> {
  try {
    return await prisma.art.findMany({
      where: { pitchId },
    })
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    throw new Error(handledError.message)
  }
}

// Define the PitchDetails type
type PitchDetails = {
  pitch: Pitch
  art: Art[]
}
