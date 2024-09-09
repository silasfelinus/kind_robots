import { defineEventHandler, readBody } from 'h3'
import type { Todo } from '@prisma/client'
import { updateTodo } from './index' // Import your update function
import { errorHandler } from '../utils/error' // Import your centralized error handler

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) // Assuming readBody parses and returns the body as JSON
    const { id, content, notes, isCompleted, task, userId } = body

    // Validate the presence of required fields
    if (!id) {
      return { success: false, message: 'ID is required to update a Todo.' }
    }

    // Prepare the updateTodoData object based on the available properties in the body
    const updateTodoData: Partial<Todo> = {}

    if (content !== undefined) updateTodoData.content = content
    if (notes !== undefined) updateTodoData.notes = notes
    if (isCompleted !== undefined) updateTodoData.isCompleted = isCompleted
    if (task !== undefined) updateTodoData.task = task
    if (userId !== undefined) updateTodoData.userId = userId

    // Call the update function with the id and updateTodoData
    const updatedTodo = await updateTodo(id, updateTodoData)

    // Check if the update was successful
    if (!updatedTodo) {
      return {
        success: false,
        message: 'Todo not found or could not be updated.',
      }
    }

    return { success: true, todo: updatedTodo }
  } catch (error: unknown) {
    // Handle errors using the centralized error handler
    const { message } = errorHandler(error)
    console.error(`Failed to update todo: ${message}`)
    return { success: false, message: `Failed to update todo: ${message}` }
  }
})
