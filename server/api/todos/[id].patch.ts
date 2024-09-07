import { defineEventHandler, readBody } from 'h3'
import { updateTodoById } from './index' // Import update function from a shared module
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id)) {
      return {
        success: false,
        message: 'Invalid ID format.',
        statusCode: 400, // Bad Request
      }
    }

    const body = await readBody(event)
    const updatedTodo = await updateTodoById(id, body)

    if (!updatedTodo) {
      return {
        success: false,
        message: 'Todo not found or could not be updated.',
        statusCode: 404, // Not Found
      }
    }

    return { success: true, todo: updatedTodo }
  } catch (error: unknown) {
    // Use the errorHandler to process the error
    return errorHandler(error)
  }
})
