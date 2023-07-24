// server/api/Galleries/random.get.ts
import { randomGallery } from '.'

export default defineEventHandler(async () => {
  try {
    const Gallery = await randomGallery()
    if (!Gallery) {
      throw new Error(`No Galleries available.`)
    }
    return { success: true, Gallery }
  } catch (error) {
    return { success: false, message: 'No Gallery available' }
  }
})
