import { defineEventHandler } from 'h3'
import { fetchTodos } from '.'

// Define the event handler for GET requests to /api/todos
export default defineEventHandler(async (event) => {
  try {
    // Parse query parameters for pagination
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 100

    // Fetch todos using your fetchTodos function
    const todos = await fetchTodos(page, pageSize)

    // Return the fetched todos
    return { success: true, todos }
  } catch (error: any) {
    console.error(`Failed to fetch todos: ${error.message}`) // Log the error for debugging
    return { success: false, message: 'Failed to fetch todos.' }
  }
})
