// /server/api/training/lines/index.get.ts
import { defineEventHandler } from 'h3'
import { fetchAllTrainingLines } from './'

export default defineEventHandler(async () => {
  try {
    const lines = await fetchAllTrainingLines()
    return { success: true, lines }
  } catch (error: any) {
    return { success: false, message: 'Failed to fetch training lines', error: error.message }
  }
})
