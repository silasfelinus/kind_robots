// /server/api/bot/id/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import type { Prisma, Bot } from '@prisma/client'
import prisma from './../../utils/prisma'

async function updateBot(id: number, data: Partial<Bot>): Promise<Bot | null> {
  try {
    return await prisma.bot.update({
      where: { id },
      data: data as Prisma.BotUpdateInput,
    })
  } catch (error) {
    console.error(`Failed to update bot with id "${id}": ${error}`)
    return null
  }
}

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  if (isNaN(id) || id <= 0) {
    return { success: false, message: 'Invalid bot id.' }
  }

  try {
    const data = await readBody(event)

    if (!data || Object.keys(data).length === 0) {
      return { success: false, message: 'No data provided for update.' }
    }

    const updatedBot = await updateBot(id, data)

    if (!updatedBot) {
      return { success: false, message: `Bot with id "${id}" not found.` }
    }

    return { success: true, bot: updatedBot }
  } catch (error: unknown) {
    console.error(`Failed to update bot with id "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      success: false,
      message: `Failed to update bot with id "${id}". ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
})
