// /server/api/bot/id/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import type { Prisma, Bot } from '@prisma/client'
import prisma from './../../utils/prisma'

// Fetch bot by id
export async function fetchBotById(id: number): Promise<Bot | null> {
  try {
    const bot = await prisma.bot.findUnique({
      where: { id },
    })
    console.log(`Fetched bot with id "${id}":`, bot)
    return bot
  } catch (error) {
    console.error(`Error fetching bot with id "${id}":`, error)
    return null
  }
}

// Update bot by id
async function updateBot(id: number, data: Partial<Bot>): Promise<Bot | null> {
  try {
    const updatedBot = await prisma.bot.update({
      where: { id },
      data: data as Prisma.BotUpdateInput,
    })
    console.log(`Bot with id "${id}" updated successfully:`, updatedBot)
    return updatedBot
  } catch (error) {
    console.error(`Failed to update bot with id "${id}":`, error)
    return null
  }
}

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  // Validate bot ID
  if (isNaN(id) || id <= 0) {
    console.error(`Invalid bot ID provided: "${event.context.params?.id}"`)
    return { success: false, message: 'Invalid bot id.' }
  }

  // Fetch the bot by ID to ensure it exists before updating
  const existingBot = await fetchBotById(id)
  if (!existingBot) {
    console.error(`Bot with id "${id}" not found.`)
    return { success: false, message: `Bot with id "${id}" not found.` }
  }

  try {
    const data = await readBody(event)
    console.log(`Data received for updating bot with id "${id}":`, data)

    // Check if data is provided
    if (!data || Object.keys(data).length === 0) {
      console.error(`No data provided for updating bot with id "${id}"`)
      return { success: false, message: 'No data provided for update.' }
    }

    // Attempt to update the bot
    const updatedBot = await updateBot(id, data)

    if (!updatedBot) {
      console.error(`Failed to update bot with id "${id}"`)
      return { success: false, message: `Bot with id "${id}" not found.` }
    }

    console.log(`Bot with id "${id}" updated successfully.`)
    return { success: true, bot: updatedBot }
  } catch (error: unknown) {
    console.error(
      `Failed to update bot with id "${id}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return {
      success: false,
      message: `Failed to update bot with id "${id}". ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    }
  }
})
