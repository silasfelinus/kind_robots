// server/api/bot/name/[name].get.ts
import { defineEventHandler } from 'h3'
import { fetchBotByName } from '../../bots'

export default defineEventHandler(async (event) => {
  const name = String(event.context.params?.name)

  try {
    const bot = await fetchBotByName(name)

    if (!bot) {
      return {
        success: false,
        message: `Bot with name ${name} does not exist.`,
      }
    }

    return { success: true, bot }
  } catch (error: unknown) {
    console.error(
      `Failed to fetch bot with name ${name}:`,
      (error as Error).message,
    )
    return {
      success: false,
      message: `Failed to fetch bot with name ${name}: ${(error as Error).message}`,
    }
  }
})
