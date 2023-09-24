// /server/api/galleries/[name].patch.ts
import { fetchGalleryByName, updateGallery } from '..' // Import the correct methods

export default defineEventHandler(async (event) => {
  const name = String(event.context.params?.name)
  if (!name) throw new Error('Invalid gallery name.')

  try {
    // Fetch the gallery from the database
    const gallery = await fetchGalleryByName(name)

    // Make sure to await the Promise returned by readBody
    const data = await readBody(event)

    if (!gallery) {
      throw new Error('Gallery not found.')
    }

    // Update only the provided fields
    // Note: We use the gallery's id for updating, as it's usually more consistent than names.
    const updatedGallery = await updateGallery(gallery.id, data)

    return { success: true, gallery: updatedGallery }
  } catch (error) {
    return { success: false, message: `Failed to update gallery with name ${name}.` }
  }
})
