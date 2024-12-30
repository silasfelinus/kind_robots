import { defineEventHandler } from 'h3'
import type { Pitch } from '@prisma/client'
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

    // Fetch the pitch by ID without including any art data
    const data = await fetchPitchById(id)
    if (!data) {
      return {
        success: false,
        message: 'Pitch not found',
        statusCode: 404,
      }
    }

    response = {
      success: true,
      message: 'Pitch details fetched successfully.',
      data, // Return the pitch details under data
      statusCode: 200,
    }
    event.node.res.statusCode = response.statusCode
  } catch (error: unknown) {
    return errorHandler(error)
  }

  return response
})

export async function fetchPitchById(id: number): Promise<Pitch | null> {
  try {
    // Fetch the pitch by ID without including related Art data
    const pitch = await prisma.pitch.findUnique({
      where: { id },
    })

    return pitch || null
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    throw new Error(handledError.message)
  }
}
