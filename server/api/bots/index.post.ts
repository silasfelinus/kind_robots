// /server/api/bots/index.post.ts
import { addBots } from '.'

export default defineEventHandler(async (event) => {
  try {
    const botsData = await readBody(event)
    const result = await addBots(botsData)
    return { success: true, ...result }
  } catch (error) {
    return { success: false, message: 'failed to create a new bot' }
  }
})
