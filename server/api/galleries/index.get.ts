// server/api/Galleriess/index.get.ts
import { defineEventHandler } from 'h3'
import { fetchGalleries } from '.'

export default defineEventHandler(async (event) => {
  try {
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 100
    const Galleries = await fetchGalleries()
    return { success: true, Galleries }
  } catch (error) {
    return { success: false, message: 'Failed to fetch Galleries.' }
  }
})
