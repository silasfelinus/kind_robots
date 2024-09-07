import { defineEventHandler } from 'h3'
import { fetchTodoById } from './index' // Import fetch function from a shared module
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

    const todo = await fetchTodoById(id)

    if (!todo) {
      return {
        success: false,
        message: 'Todo not found.',
        statusCode: 404, // Not Found
      }
    }

    return { success: true, todo }
  } catch (error: unknown) {
    // Use the errorHandler to process the error
    return errorHandler(error)
  }
})
