// server/api/galleries/batch.patch.ts
import { defineEventHandler, readBody } from 'h3'
import { fetchGalleryByName, updateGallery } from '.'

// Define the batch update handler
export default defineEventHandler(async (event) => {
  try {
    // Make sure to await the Promise returned by readBody
    const galleriesData = await readBody(event)

    if (!Array.isArray(galleriesData)) {
      throw new TypeError('Expected an array of gallery updates')
    }

    const updatedGalleries = []
    const errors = []

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

      // Update the gallery
      try {
        const updatedGallery = await updateGallery(gallery.id, data)
        updatedGalleries.push(updatedGallery)
      } catch (err: any) {
        errors.push(`Failed to update gallery named ${name}: ${err.message}`)
      }
    }

    return {
      success: errors.length === 0,
      updatedGalleries,
      errors
    }
  } catch (error) {
    return { success: false, message: 'Failed to update galleries.' }
  }
})
