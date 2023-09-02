// /server/api/training/lines/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createTrainingLine } from './'

export default defineEventHandler(async (event) => {
  try {
    const lineData = await readBody(event)

    if (!lineData || !lineData.role || !lineData.content) {
      return { success: false, message: 'Invalid JSON body' }
    }

    const newLine = await createTrainingLine(lineData)
    return { success: true, line: newLine }
  } catch (error: any) {
    return { success: false, message: 'Failed to create new training line', error: error.message }
  }
})
