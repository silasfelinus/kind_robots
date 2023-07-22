// server/api/galleries/random.get.ts
import { ErrorHandler } from '../utils/error'
import { randomGallery } from '../utils/gallery'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const Gallery = await randomGallery()

    return Gallery
  }, 'Gallery not found')
)
