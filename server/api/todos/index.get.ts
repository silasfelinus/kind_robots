import { defineEventHandler } from 'h3'
import { fetchTodos } from '.'
import { errorHandler } from '../utils/error' // Import your centralized error handler

// Define the event handler for GET requests to /api/todos
export default defineEventHandler(async (event) => {
  try {
    // Parse query parameters for pagination
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 100

    // Validate the parsed page and pageSize values
    if (isNaN(page) || page <= 0) {
      return { success: false, message: 'Invalid page number.' }
    }
    if (isNaN(pageSize) || pageSize <= 0) {
      return { success: false, message: 'Invalid page size.' }
    }

    // Fetch todos using your fetchTodos function
    const todos = await fetchTodos(page, pageSize)

    // Return the fetched todos
    return { success: true, todos }
  } catch (error: unknown) {
    const { message } = errorHandler(error)
    console.error(`Failed to fetch todos: ${message}`) // Log the error for debugging
    return { success: false, message: `Failed to fetch todos: ${message}` }
  }
})
