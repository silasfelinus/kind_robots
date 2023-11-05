// server/api/galleries/count.get.ts
import { defineEventHandler } from 'h3'
import { countGalleries } from '.'

export default defineEventHandler(async () => {
  try {
    const count = await countGalleries()
    return { success: true, count }
  } catch (error) {
    return { success: false, message: 'Failed to get galleries count.' }
  }
})
