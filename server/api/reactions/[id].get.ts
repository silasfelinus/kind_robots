// server/api/reactions/[id].get.ts
import { fetchReactionById } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid reaction ID.')
  try {
    const reaction = await fetchReactionById(id)
    if (!reaction) throw new Error(`Reaction with id ${id} does not exist.`)
    return { success: true, reaction }
  } catch (error) {
    return { success: false, message: `Failed to fetch reaction with id ${id}.` }
  }
})
