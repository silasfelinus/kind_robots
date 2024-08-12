import { defineEventHandler, readBody } from 'h3'
import { deleteTodo } from '.'
import { errorHandler } from '../utils/error' // Import your centralized error handler

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id } = body

    if (!id || typeof id !== 'number') {
      return { success: false, message: 'Invalid or missing ID.' }
    }

    const success = await deleteTodo(id)
    if (!success) {
      return { success: false, message: `Todo with ID ${id} not found.` }
    }

    return { success: true, message: `Todo with ID ${id} successfully deleted.` }
  } catch (error: unknown) {
    const { message } = errorHandler(error)
    console.error(`Failed to delete todo: ${message}`)
    return { success: false, message: `Failed to delete todo: ${message}` }
  }
})
