// ~/server/api/prompts/index.get.ts
import { fetchPrompts } from '.'

export default defineEventHandler(async (event) => {
  try {
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 10
    const prompts = await fetchPrompts(page, pageSize)
    return { success: true, prompts }
  } catch (error) {
    return { success: false, message: 'Failed to fetch prompts.' }
  }
})
