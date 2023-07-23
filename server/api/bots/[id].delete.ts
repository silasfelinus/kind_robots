// server/api/bots/[id].delete.ts
import prisma from './../utils/prisma'
import { deleteBot } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid bot ID.')
  try {
    const bot = await prisma.bot.findUnique({ where: { id } })

    if (!bot) {
      throw new Error(`Bot with id ${id} does not exist.`)
    }

    await deleteBot(id)

    return { success: true, message: `Bot with id ${id} successfully deleted.` }
  } catch (error) {
    return { success: false, message: `Failed to delete bot with id ${id}.` }
  }
})
