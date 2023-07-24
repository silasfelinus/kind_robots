// /server/api/resources/[id].patch.ts
import { fetchResourceById, updateResource } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid Resource ID.')
  try {
    // Fetch the Resource from the database
    const Resource = await fetchResourceById(id)

    // Make sure to await the Promise returned by readBody
    const data = await readBody(event)

    if (!Resource) {
      throw new Error('Resource not found.')
    }

    // Update only the provided fields
    const updatedResource = await updateResource(id, data)

    return { success: true, Resource: updatedResource }
  } catch (error) {
    return { success: false, message: `Failed to update Resource with id ${id}.` }
  }
})
