// ~/server/api/reactions/index.get.ts
import { fetchReactions } from '.'

export default defineEventHandler(async (event) => {
  try {
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 10
    const reactions = await fetchReactions(page, pageSize)
    return { success: true, reactions }
  } catch (error) {
    return { success: false, message: 'Failed to fetch reactions.' }
  }
})
