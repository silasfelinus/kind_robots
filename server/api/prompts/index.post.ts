// /server/api/prompts/index.post.ts
import { addPrompts } from '.'

export default defineEventHandler(async (event) => {
  try {
    const promptsData = await readBody(event)
    const result = await addPrompts(promptsData)
    return { success: true, ...result }
  } catch (error) {
    return { success: false, message: 'Failed to create new prompts' }
  }
})
