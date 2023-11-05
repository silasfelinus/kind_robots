// /server/api/todos/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { addTodos } from '.' // Import your addTodos function

export default defineEventHandler(async (event) => {
  try {
    const todosData = await readBody(event) // Assuming readBody returns parsed JSON

    if (!Array.isArray(todosData)) {
      return { success: false, message: 'Invalid JSON body' }
    }

    const result = await addTodos(todosData)
    return { success: true, ...result }
  } catch (error: any) {
    return { success: false, message: 'Failed to create new todos', error: error.message }
  }
})
