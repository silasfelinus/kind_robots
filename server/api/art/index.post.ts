import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from './../utils/prisma'
import type { Prisma, Art } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const artData = await readBody<Partial<Art>>(event)

    // Validate required fields
    if (!artData.promptString) {
      event.node.res.statusCode = 400 // Bad Request
      return {
        success: false,
        message: '"promptString" is a required field.',
      }
    }

    const result = await addArt(artData)

    if (result.error) {
      event.node.res.statusCode = 500 // Internal Server Error if addArt fails
      return {
        success: false,
        message: result.error,
      }
    }

    // Art created successfully, return 201 status
    event.node.res.statusCode = 201 // Created
    return { success: true, data: { art: result.art } }
  } catch (error) {
    // Use the error handler to process the error
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message: 'Failed to create a new art object',
      error: handledError.message || 'An unknown error occurred',
    }
  }
})

export async function addArt(
  artData: Partial<Art>,
): Promise<{ art: Art | null; error: string | null }> {
  try {
    const art = await prisma.art.create({
      data: artData as Prisma.ArtCreateInput,
    })
    return { art, error: null }
  } catch (error: unknown) {
    // Enhanced error messaging, sending along the specific error
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error'
    return { art: null, error: `Failed to create art: ${errorMessage}` }
  }
}
