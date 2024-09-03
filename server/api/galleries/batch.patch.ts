// server/api/galleries/batch.patch.ts
import { defineEventHandler, readBody } from 'h3'
import { fetchGalleryByName, updateGallery } from '.'
import { errorHandler } from '../utils/error'
import type { Prisma, Gallery } from '@prisma/client'

// Define types for the gallery update data and response
type GalleryUpdateData = Partial<{
  name: string
  content: string
  description: string | null
  url: string | null
  isMature: boolean
  custodian: string | null
  userId: number | null
  highlightImage: string | null
  imagePaths: string | null
}>

type BatchUpdateResponse = {
  success: boolean
  updatedGalleries?: Gallery[]
  errors?: string[]
  message?: string
  statusCode?: number
}

export default defineEventHandler(async (event) => {
  try {
    const galleriesData: GalleryUpdateData[] = await readBody(event)

    if (!Array.isArray(galleriesData)) {
      throw new TypeError('Expected an array of gallery updates')
    }

    const updatedGalleries: Gallery[] = []
    const errors: string[] = []

    for (const galleryData of galleriesData) {
      const { name, ...data } = galleryData

      if (!name) {
        errors.push('Gallery name is missing.')
        continue
      }

      // Fetch the gallery by name
      const gallery = await fetchGalleryByName(name)

      if (!gallery) {
        errors.push(`Gallery named ${name} not found.`)
        continue
      }

      // Ensure data conforms to Prisma.GalleryUpdateInput
      const updateData: Prisma.GalleryUpdateInput = {
        ...data,
      }

      // Update the gallery
      try {
        const updatedGallery = await updateGallery(gallery.id, updateData)
        if (updatedGallery) {
          updatedGalleries.push(updatedGallery)
        } else {
          errors.push(`Failed to update gallery named ${name}.`)
        }
      } catch (err: unknown) {
        // Handle errors during the update process
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Failed to update gallery named ${name}: ${errorMessage}`)
      }
    }

    return {
      success: errors.length === 0,
      updatedGalleries,
      errors,
    } as BatchUpdateResponse
  } catch (error: unknown) {
    // Use the errorHandler to handle and format the error
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || 'Failed to update galleries.',
      statusCode: handledError.statusCode || 500,
    } as BatchUpdateResponse
  }
})
