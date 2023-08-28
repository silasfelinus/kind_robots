// /server/api/prompts/[id].patch.ts
import { fetchPromptById, updatePrompt } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid Prompt ID.')
  try {
    // Fetch the Prompt from the database
    const prompt = await fetchPromptById(id)

    // Make sure to await the Promise returned by readBody
    const data = await readBody(event)

    if (!prompt) {
      throw new Error('Prompt not found.')
    }

    // Update only the provided fields
    const updatedPrompt = await updatePrompt(id, data)

    return { success: true, prompt: updatedPrompt }
  } catch (error) {
    return { success: false, message: `Failed to update Prompt with id ${id}.` }
  }
})
