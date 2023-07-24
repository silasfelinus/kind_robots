// server/api/resources/index.get.ts
import { fetchResources } from '.'

export default defineEventHandler(async (event) => {
  try {
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 10
    const Resources = await fetchResources(page, pageSize)
    return { success: true, Resources }
  } catch (error) {
    return { success: false, message: 'Failed to fetch Resources.' }
  }
})
