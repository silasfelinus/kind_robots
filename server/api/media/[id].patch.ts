// /server/api/media/[id].patch.ts
import { fetchMediaById, updateMedia } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid Media ID.')
  try {
    // Fetch the Media from the database
    const Media = await fetchMediaById(id)

    // Make sure to await the Promise returned by readBody
    const data = await readBody(event)

    if (!Media) {
      throw new Error('Media not found.')
    }

    // Update only the provided fields
    const updatedMedia = await updateMedia(id, data)

    return { success: true, Media: updatedMedia }
  } catch (error) {
    return { success: false, message: `Failed to update Media with id ${id}.` }
  }
})
