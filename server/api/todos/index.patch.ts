import { defineEventHandler } from 'h3' // Replace with the actual import for H3's defineEventHandler
import { Todo } from '@prisma/client'
import { updateTodo } from '.' // Import your updateTodo function

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) // Assuming readBody parses and returns the body as JSON
    const { id, task, category, userId, rewardId, completed } = body

    if (!id) {
      return { success: false, message: 'ID is required to update a Todo.' }
    }

    // Create an updateTodoData object with the parameters that are provided
    const updateTodoData: Partial<Todo> = {}
    if (task) updateTodoData.task = task
    if (category) updateTodoData.category = category
    if (userId) updateTodoData.userId = userId
    if (rewardId) updateTodoData.rewardId = rewardId
    if (completed !== undefined) updateTodoData.completed = completed

    const updatedTodo = await updateTodo(id, updateTodoData)

    if (!updatedTodo) {
      return { success: false, message: 'Todo not found or could not be updated.' }
    }

    return { success: true, todo: updatedTodo }
  } catch (error: any) {
    console.error(`Failed to update todo: ${error.message}`)
    return { success: false, message: `Failed to update todo: ${error.message}` }
  }
})
