// /server/api/pitches/art/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let response

  try {
    const id = Number(event.context.params?.id)

    // Validate if id is a valid number
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Pitch ID. It must be a positive integer.',
      })
    }

    // Fetch the art related to the given pitch ID
    const artEntries = await fetchArtByPitchId(id)

    if (artEntries.length === 0) {
      return {
        success: false,
        message: 'No art found for this pitch.',
        statusCode: 404,
      }
    }

    // Successful response with art entries
    response = {
      success: true,
      artEntries,
      message: 'Art fetched successfully.',
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch art entries.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// Function to fetch Art related to the Pitch by ID
async function fetchArtByPitchId(pitchId: number) {
  try {
    return await prisma.art.findMany({
      where: { pitchId }, // Assuming 'pitchId' is a valid foreign key in your Art model
    })
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    throw new Error(handledError.message)
  }
}
