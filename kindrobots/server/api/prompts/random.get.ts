// server/api/prompts/random.get.ts
import { randomPrompt } from '.'

export default defineEventHandler(async () => {
  try {
    const prompt = await randomPrompt()
    if (!prompt) throw new Error('No prompts available.')
    return { success: true, prompt }
  } catch (error) {
    return { success: false, message: 'Failed to fetch random prompt.' }
  }
})
