// /server/api/bot/index.post.ts
import { updateBot } from '../bots'

export default defineEventHandler(async (event) => {
  try {
    const botsData = await readBody(event)
    const result = await updateBot(botsData.name, botsData)
    return { success: true, ...result }
  } catch (error: any) {
    return { success: false, message: 'Failed to create a new bot', error: error.message }
  }
})
