// /server/api/galleries/index.post.ts
import { ErrorHandler } from '../utils/error'
import { createGallery } from '../utils/gallery'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const body = await readBody(event)

    // Creating multiple Galleries.
    const newGalleries = await createGallery(body)

    return newGalleries
  }, 'An error occurred while creating Galleries.')
)
