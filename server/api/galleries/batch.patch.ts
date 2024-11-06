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
  message?: string
  updatedGalleries?: Gallery[]
  errors?: string[]
  statusCode?: number
}

export default defineEventHandler(async (event) => {
  let response: BatchUpdateResponse
  try {
    const galleriesData: GalleryUpdateData[] = await readBody(event)

    if (!Array.isArray(galleriesData)) {
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

      // Fetch the gallery by name using findFirst
      const gallery = await prisma.gallery.findFirst({ where: { name } })

      if (!gallery) {
        errors.push(`Gallery named '${name}' not found.`)
        continue
      }

      // Prepare Prisma update input for the gallery
      const updateData: Prisma.GalleryUpdateInput = { ...data }

      try {
        const updatedGallery = await prisma.gallery.update({
          where: { id: gallery.id }, // Use the found gallery's ID
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
      message: errors.length > 0 ? 'Some galleries were not updated.' : 'All galleries updated successfully.',
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
