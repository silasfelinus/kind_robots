// server/api/prompts/[id].delete.ts

import { deletePrompt } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid prompt ID.')
  try {
    const deleted = await deletePrompt(id)
    if (!deleted) throw new Error(`Prompt with id ${id} does not exist.`)
    return { success: true, message: `Prompt with id ${id} successfully deleted.` }
  } catch (error) {
    return { success: false, message: `Failed to delete prompt with id ${id}.` }
  }
})
