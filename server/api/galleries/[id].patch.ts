// /server/api/gallerys/[id].patch.ts
import { ErrorHandler } from '../utils/error'
import { findGallery, updateGallery } from '../utils/gallery'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const body = await readBody(event)
    const id = Number(event.context.params?.id)

    if (!id) {
      throw new Error('Missing ID parameter.')
    }

    // Fetch the gallery from the database
    const gallery = await findGallery(id)

    if (!gallery) {
      throw new Error('Gallery not found.')
    }

    // Update only the provided fields
    const updatedGallery = await updateGallery(id, body)

    return updatedGallery
  }, 'An error occurred while updating the gallery.')
)
