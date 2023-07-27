// /server/api/bots/index.post.ts
import { addBots } from '.'

export default defineEventHandler(async (event) => {
  try {
    const botsData = await readBody(event)
    const result = await addBots(botsData)
    return { success: true, ...result }
  } catch (error: any) {
    return { success: false, message: 'Failed to create a new bot', error: error.message }
  }
})
