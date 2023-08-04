// server/api/galleries/[id].get.ts
import { fetchGalleryById } from '..'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid Gallery ID.')
  try {
    const Gallery = await fetchGalleryById(id)

    if (!Gallery) {
      throw new Error(`Gallery with id ${id} does not exist.`)
    }

    return { success: true, Gallery }
  } catch (error) {
    return { success: false, message: `Failed to fetch Gallery with id ${id}.` }
  }
})
