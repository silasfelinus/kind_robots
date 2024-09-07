import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma' // Assuming you're using Prisma for database interaction
import { errorHandler } from '../utils/error'
import type { Todo} from '@prisma/client'

// Update function using Prisma, or keep your existing updateTodoById function
async function updateTodoById(id: number, data: Partial<Todo>) {
  return await prisma.todo.update({
    where: { id },
    data,
  })
}

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    
    // Validate ID input
    if (isNaN(id) || id <= 0) {
      return {
        success: false,
        message: 'Invalid ID format.',
        statusCode: 400, // Bad Request
      }
    }

    // Parse the request body
    const body = await readBody(event)

    // Ensure body is not empty
    if (!body || Object.keys(body).length === 0) {
      return {
        success: false,
        message: 'Empty request body.',
        statusCode: 400, // Bad Request
      }
    }

    // Update the Todo item by its ID
    const updatedTodo = await updateTodoById(id, body)

    // Handle case where no matching Todo was found
    if (!updatedTodo) {
      return {
        success: false,
        message: 'Todo not found or could not be updated.',
        statusCode: 404, // Not Found
      }
    }

    // Success response
    return {
      success: true,
      todo: updatedTodo,
      statusCode: 200, // OK
    }
  } catch (error: unknown) {
    // Use the errorHandler to process and log the error
    return errorHandler(error)
  }
})
