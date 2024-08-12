// /server/api/todos/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { addTodos } from '.' // Import your addTodos function
import { errorHandler } from '../utils/error' // Import your centralized error handler

export default defineEventHandler(async (event) => {
  try {
    const todosData = await readBody(event) // Assuming readBody returns parsed JSON

    if (!Array.isArray(todosData)) {
      return { success: false, message: 'Invalid JSON body. Expected an array of todos.' }
    }

    const result = await addTodos(todosData)
    return { success: true, ...result }
  } catch (error: unknown) {
    const { message } = errorHandler(error)
    return { success: false, message: 'Failed to create new todos', error: message }
  }
})
