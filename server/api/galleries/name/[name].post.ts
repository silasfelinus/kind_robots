// /server/api/galleries/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { addGalleries } from '..' // Import the correct function

// Define the type for gallery items
type GalleryItem = {
  name: string
  content: string
  description?: string // Optional
  url?: string | null // Optional
  isMature?: boolean
  custodian?: string | null
  userId?: number | null
  highlightImage?: string | null
  imagePaths?: string | null
}

// Define the type for gallery data
type GalleryData = GalleryItem[]

export default defineEventHandler(async (event) => {
  try {
    // Read and validate the galleries data from the request body
    const galleriesData: GalleryData = await readBody(event)

    // Check if the data is an array
    if (!Array.isArray(galleriesData)) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Expected an array of gallery objects.',
      })
    }

    // Add galleries to the database
    const result = await addGalleries(galleriesData)

    return { success: true, ...result }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      message: 'Failed to create new galleries.',
      error: errorMessage,
    }
  }
})
