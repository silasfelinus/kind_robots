// /server/api/training/lines/batch.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createTrainingLinesBatch } from './' // Import the batch creation function

export default defineEventHandler(async (event) => {
  try {
    const linesData = await readBody(event)

    if (!Array.isArray(linesData)) {
      return { success: false, message: 'Invalid JSON body. Expected an array of lines.' }
    }

    // Validate each lineData object in the array
    for (const lineData of linesData) {
      if (!lineData.role || !lineData.content) {
        return { success: false, message: 'Each line must have both a role and content.' }
      }
    }

    const { count, lines, errors } = await createTrainingLinesBatch(linesData)

    if (errors.length > 0) {
      return { success: false, message: 'Some lines could not be created.', errors }
    }

    return { success: true, count, lines }
  } catch (error: any) {
    return { success: false, message: 'Failed to create new training lines', error: error.message }
  }
})
