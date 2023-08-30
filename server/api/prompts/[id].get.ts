// server/api/prompts/[id].get.ts
import { fetchPromptById } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid prompt ID.')
  try {
    const prompt = await fetchPromptById(id)
    if (!prompt) throw new Error(`Prompt with id ${id} does not exist.`)
    return { success: true, prompt }
  } catch (error) {
    return { success: false, message: `Failed to fetch prompt with id ${id}.` }
  }
})
