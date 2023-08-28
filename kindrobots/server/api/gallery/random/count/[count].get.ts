import { randomGallery, countGalleries } from '../..'

export default defineEventHandler(async (req) => {
  try {
    const count = parseInt(req.params.count, 10)
    const totalGalleries = await countGalleries()

    if (isNaN(count) || count <= 0 || count > totalGalleries) {
      throw new Error('Invalid count parameter.')
    }

    const uniqueGalleryNames = new Set()
    while (uniqueGalleryNames.size < count) {
      const gallery = await randomGallery()
      if (!gallery || !gallery.name) {
        break // Stop the loop if we've exhausted all available galleries
      }
      uniqueGalleryNames.add(gallery.name)
    }

    return { success: true, galleryNames: [...uniqueGalleryNames] }
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to fetch random gallery names.',
      error: error.message
    }
  }
})
