// server/api/resources/[id].get.ts
import { fetchResourceById } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid Resource ID.')
  try {
    const Resource = await fetchResourceById(id)

    if (!Resource) {
      throw new Error(`Resource with id ${id} does not exist.`)
    }

    return { success: true, Resource }
  } catch (error) {
    return { success: false, message: `Failed to fetch Resource with id ${id}.` }
  }
})
