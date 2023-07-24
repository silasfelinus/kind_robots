// server/api/media/[id].delete.ts
import { fetchMediaById } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid media ID.')
  try {
    const media = await fetchMediaById(id)
    if (!media) throw new Error(`Media with id ${id} does not exist.`)
    return { success: true, media }
  } catch (error) {
    return { success: false, message: `Failed to fetch media with id ${id}.` }
  }
})
