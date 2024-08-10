import { defineEventHandler, readBody } from 'h3' // Replace with the actual import for H3's defineEventHandler
import { deleteTodo } from '.' // Import your deleteTodo function

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id } = body
    const success = await deleteTodo(id)
    return { success }
  }
  catch (error: any) {
    console.error(`Failed to delete todo: ${error.message}`)
    return { success: false, message: 'Failed to delete todo.' }
  }
})
