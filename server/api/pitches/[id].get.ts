import { defineEventHandler } from 'h3'
import type { Pitch, Art, Channel } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id)) {
      return { success: false, message: 'Invalid ID', statusCode: 400 }
    }

    // Fetch the pitch by ID and its related data
    const pitchDetails = await fetchPitchById(id)
    if (!pitchDetails) {
      return { success: false, message: 'Pitch not found', statusCode: 404 }
    }

    return { success: true, ...pitchDetails } // Spread pitchDetails directly in the response
  } catch (error: unknown) {
    return errorHandler(error)
  }
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

    // Fetch related data if pitch.channelId is present
    const [art, channel] = await Promise.all([
      fetchArtByPitchId(id),
      pitch.channelId
        ? fetchChannelByPitchId(pitch.channelId)
        : Promise.resolve(null),
    ])

    return { pitch, art, channel }
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

// Fetch Channel related to the Pitch
async function fetchChannelByPitchId(
  channelId: number,
): Promise<Channel | null> {
  try {
    return await prisma.channel.findUnique({
      where: { id: channelId },
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
  channel: Channel | null
}
