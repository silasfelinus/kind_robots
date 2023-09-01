import { defineEventHandler } from 'h3' // Replace with the actual import for H3's defineEventHandler
import { deleteReward } from '.' // Import your deleteReward function

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id } = body
    const success = await deleteReward(id)
    return { success }
  } catch (error: any) {
    console.error(`Failed to delete reward: ${error.message}`)
    return { success: false, message: 'Failed to delete reward.' }
  }
})
