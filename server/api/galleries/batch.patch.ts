// server/api/galleries/batch.patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma, Gallery } from '@prisma/client'

// Define types for gallery update data and batch response
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
  let response: BatchUpdateResponse
  try {
    const galleriesData: GalleryUpdateData[] = await readBody(event)

    if (!Array.isArray(galleriesData)) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Expected an array of gallery updates.',
      })
    }

    const updatedGalleries: Gallery[] = []
    const errors: string[] = []

    // Loop through each gallery data object to perform updates
    for (const galleryData of galleriesData) {
      const { name, ...data } = galleryData

      if (!name) {
        errors.push('Gallery name is missing in update data.')
        continue
      }

      // Fetch the gallery by name
      const gallery = await prisma.gallery.findUnique({ where: { name } })

      if (!gallery) {
        errors.push(`Gallery named '${name}' not found.`)
        continue
      }

      // Confirm gallery ID exists and is a number before proceeding
      const galleryId = gallery.id
      if (typeof galleryId !== 'number') {
        errors.push(`Gallery '${name}' has an invalid ID.`)
        continue
      }

      // Prepare Prisma update input for the gallery
      const updateData: Prisma.GalleryUpdateInput = { ...data }

      try {
        const updatedGallery = await prisma.gallery.update({
          where: { id: galleryId },
          data: updateData,
        })
        updatedGalleries.push(updatedGallery)
      } catch (err: unknown) {
        // Log individual update failures
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Failed to update gallery '${name}': ${errorMessage}`)
      }
    }

    // Build response based on update results
    response = {
      success: errors.length === 0,
      updatedGalleries,
      errors,
      statusCode: errors.length > 0 ? 207 : 200, // 207 for partial success
    }
    event.node.res.statusCode = response.statusCode ?? 500
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || 'Failed to update galleries.',
      statusCode: handledError.statusCode || 500,
    }
    event.node.res.statusCode = response.statusCode ?? 500
  }

  return response
})
