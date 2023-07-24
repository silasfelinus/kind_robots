// server/api/Galleriess/index.get.ts
import { fetchGalleries } from '.'

export default defineEventHandler(async (event) => {
  try {
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 10
    const Galleries = await fetchGalleries(page, pageSize)
    return { success: true, Galleries }
  } catch (error) {
    return { success: false, message: 'Failed to fetch Galleries.' }
  }
})
