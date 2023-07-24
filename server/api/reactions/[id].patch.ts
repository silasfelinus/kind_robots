// /server/api/reactions/[id].patch.ts
import { fetchReactionById, updateReaction } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid Reaction ID.')
  try {
    // Fetch the Reaction from the database
    const Reaction = await fetchReactionById(id)

    // Make sure to await the Promise returned by readBody
    const data = await readBody(event)

    if (!Reaction) {
      throw new Error('Reaction not found.')
    }

    // Update only the provided fields
    const updatedReaction = await updateReaction(id, data)

    return { success: true, Reaction: updatedReaction }
  } catch (error) {
    return { success: false, message: `Failed to update Reaction with id ${id}.` }
  }
})
