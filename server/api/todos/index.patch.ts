import { defineEventHandler, readBody } from 'h3'
import type { Todo } from '@prisma/client'
import { updateTodo } from '.'
import { errorHandler } from '../utils/error' // Import your centralized error handler

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) // Assuming readBody parses and returns the body as JSON
    const { id, task, category, userId, rewardId, completed } = body

    if (!id) {
      return { success: false, message: 'ID is required to update a Todo.' }
    }

    // Create an updateTodoData object with the parameters that are provided
    const updateTodoData: Partial<Todo> = {}
    if (task !== undefined) updateTodoData.task = task
    if (category !== undefined) updateTodoData.category = category
    if (userId !== undefined) updateTodoData.userId = userId
    if (rewardId !== undefined) updateTodoData.rewardId = rewardId
    if (completed !== undefined) updateTodoData.completed = completed

    const updatedTodo = await updateTodo(id, updateTodoData)

    if (!updatedTodo) {
      return {
        success: false,
        message: 'Todo not found or could not be updated.',
      }
    }

    return { success: true, todo: updatedTodo }
  } catch (error: unknown) {
    const { message } = errorHandler(error)
    console.error(`Failed to update todo: ${message}`)
    return { success: false, message: `Failed to update todo: ${message}` }
  }
})
