// server/api/bot/name/[name].get.ts
import { fetchBotByName } from '../../bots'

export default defineEventHandler(async (event) => {
  const name = String(event.context.params?.name)
  try {
    const bot = await fetchBotByName(name)

    if (!bot) {
      throw new Error(`Bot with name ${name} does not exist.`)
    }

    return { success: true, bot }
  } catch (error) {
    return { success: false, message: `Failed to fetch bot with name ${name}.` }
  }
})
