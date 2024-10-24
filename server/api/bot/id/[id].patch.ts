// /server/api/bot/id/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'



async function fetchBotById(id: number): Promise<Bot | null> {
  return await prisma.bot.findUnique({
    where: { id },
  })
}


export async function updateBot(
  id: number,
  data: Partial<Bot>,
): Promise<Bot | null> {
  const botExists = await prisma.bot.findUnique({ where: { id } })

  if (!botExists) {
    return null
  }

  return await prisma.bot.update({
    where: { id },
    data: data as Prisma.BotUpdateInput,
  })
}


export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  if (!id) {
    return { success: false, message: 'Invalid bot id.' }
  }

  try {
    // Fetch the bot from the database
    const bot = await fetchBotById(id)

    if (!bot) {
      return { success: false, message: `Bot with id "${id}" not found.` }
    }

    // Read the body data
    const data = await readBody(event)

    // Update only the provided fields
    const updatedBot = await updateBot(id, data)

    return { success: true, bot: updatedBot }
  } catch (error: unknown) {
    console.error(
      `Failed to update bot with id "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    return {
      success: false,
      message: `Failed to update bot with id "${id}". ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
})
