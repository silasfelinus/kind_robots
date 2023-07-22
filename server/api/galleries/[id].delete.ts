// server/api/galleries/[id].delete.ts
import { ErrorHandler } from '../utils/error'
import { deleteGallery, findGallery } from '../utils/gallery'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const id = Number(event.context.params?.id)

    // Fetch the gallery from the database
    await findGallery(id)

    // Delete the gallery
    await deleteGallery(id)
    return { message: `gallery with id ${id} successfully deleted.` }
  }, 'An error occurred while deleting the gallery.')
)
