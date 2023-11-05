// /server/api/bot/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { addBots } from '../bots'

export default defineEventHandler(async (event) => {
  try {
    const botsData = await readBody(event)
    const result = await addBots(botsData)
    return { success: true, ...result }
  } catch (error: any) {
    return { success: false, message: 'Failed to create a new bot', error: error.message }
  }
})
