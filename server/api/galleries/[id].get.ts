// server/api/Gallerys/[id].get.ts
import { ErrorHandler } from '../utils/error'
import { findGallery } from '../utils/gallery'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const id = Number(event.context.params?.id)

    const gallery = await findGallery(id)

    return gallery
  }, 'Gallery not found')
)
