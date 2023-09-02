import { defineEventHandler, readBody } from 'h3'
import { updateTrainingLine, fetchTrainingLineById } from '.' // Import the correct methods

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid training line ID.')

  try {
    // Fetch the training line from the database
    const line = await fetchTrainingLineById(id)

    // Make sure to await the Promise returned by readBody
    const data = await readBody(event)

    if (!line) {
      throw new Error('Training line not found.')
    }

    // Update only the provided fields
    const updatedLine = await updateTrainingLine(id, data)

    return { success: true, line: updatedLine }
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to update training line with ID ${id}.`,
      error: error.message
    }
  }
})
