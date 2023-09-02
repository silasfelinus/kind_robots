// /server/api/training/lines/index.delete.ts
import { defineEventHandler, readBody } from 'h3'
import { deleteTrainingLine } from './'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id } = body

    const success = await deleteTrainingLine(id)
    return { success }
  } catch (error: any) {
    return { success: false, message: 'Failed to delete training line', error: error.message }
  }
})
