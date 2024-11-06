// server/api/galleries/index.get.ts
import { defineEventHandler } from 'h3'
import { fetchGalleries } from '.'
import { errorHandler } from '../utils/error'
import type { Gallery } from '@prisma/client' // Importing Gallery type for clarity

type GalleriesResponse = {
  success: boolean
  message?: string
  galleries?: Gallery[]
  statusCode?: number
}

export default defineEventHandler(async (): Promise<GalleriesResponse> => {
  let response: GalleriesResponse
  try {
    // Fetch galleries
    const galleries: Gallery[] = await fetchGalleries()

    // Return success response with galleries data
    response = {
      success: true,
      galleries,
      message: 'Galleries fetched successfully.',
      statusCode: 200,
    }
  } catch (error: unknown) {
    // Use the errorHandler to handle and format the error
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: 'Failed to fetch galleries.',
      error: handledError.message,
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})
