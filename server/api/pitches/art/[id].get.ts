//server/api/pitches/art/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    // Validate if id is a valid number
    if (isNaN(id)) {
      return { success: false, message: 'Invalid Pitch ID', statusCode: 400 }
    }

    // Fetch the art related to the given pitch ID
    const artEntries = await fetchArtByPitchId(id)

    if (artEntries.length === 0) {
      return { success: false, message: 'No art found for this pitch', statusCode: 404 }
    }

    return { success: true, artEntries }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to fetch Art related to the Pitch by ID
async function fetchArtByPitchId(pitchId: number) {
  try {
    return await prisma.art.findMany({
      where: { pitchId },  // Assuming 'pitchId' is a valid foreign key in your Art model
    })
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    throw new Error(handledError.message)
  }
}
