// server/api/bots/index.get.ts
import { defineEventHandler } from 'h3'
import { fetchBots } from '.'

export default defineEventHandler(async (event) => {
  try {
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 100
    const bots = await fetchBots(page, pageSize)
    return { success: true, bots }
  }
  catch (error) {
    return { success: false, message: 'Failed to fetch bots.' }
  }
})
