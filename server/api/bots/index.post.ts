// /server/api/bots/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { updateBots } from '../bots'

export default defineEventHandler(async (event) => {
  try {
    const botsData = await readBody(event)
    const result = await updateBots(botsData)
    return { success: true, ...result }
  }
  catch (error: any) {
    return { success: false, message: 'Failed to update bots', error: error.message }
  }
})
