// server/api/bots/[id].get.ts
import { fetchBotById } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid bot ID.')
  try {
    const bot = await fetchBotById(id)

    if (!bot) {
      throw new Error(`Bot with id ${id} does not exist.`)
    }

    return { success: true, bot }
  } catch (error) {
    return { success: false, message: `Failed to fetch bot with id ${id}.` }
  }
})
