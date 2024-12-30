// ~/server/api/bots/index.ts
import type { Prisma, Bot } from '@prisma/client'
import prisma from './../utils/prisma'

export async function fetchBots(
  page = 1,
  pageSize = 100,
): Promise<{ success: boolean; data: Bot[]; message?: string }> {
  const skip = (page - 1) * pageSize
  const bots = await prisma.bot.findMany({
    skip,
    take: pageSize,
  })
  return { success: true, data: bots }
}

export async function fetchBotById(
  id: number,
): Promise<{ success: boolean; data?: { bot: Bot | null }; message?: string }> {
  const bot = await prisma.bot.findUnique({ where: { id } })
  if (!bot) {
    return { success: false, message: 'Bot not found', data: { bot: null } }
  }
  return { success: true, data: { bot } }
}

export async function fetchBotByName(
  name: string,
): Promise<{ success: boolean; data?: { bot: Bot | null }; message?: string }> {
  const bot = await prisma.bot.findUnique({ where: { name } })
  if (!bot) {
    return { success: false, message: 'Bot not found', data: { bot: null } }
  }
  return { success: true, data: { bot } }
}

export async function addBot(
  botData: Partial<Bot>,
): Promise<{ success: boolean; data?: { bot: Bot }; message?: string }> {
  if (!botData.name) {
    return { success: false, message: 'Bot name is required.' }
  }

  try {
    const bot = await prisma.bot.create({
      data: botData as Prisma.BotCreateInput,
    })
    return { success: true, data: { bot } }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: errorMessage }
  }
}

export async function addBots(botsData: Partial<Bot>[]): Promise<{
  success: boolean
  data: { count: number; bots: Bot[] }
  errors: string[]
}> {
  const errors: string[] = []
  const data: Prisma.BotCreateManyInput[] = botsData
    .filter((botData) => {
      if (!botData.name) {
        errors.push(`Bot with missing name.`)
        return false
      }
      return true
    })
    .map((botData) => botData as Prisma.BotCreateManyInput)

  const result = await prisma.bot.createMany({
    data,
    skipDuplicates: true,
  })

  const bots = await prisma.bot.findMany() // Retrieve all bots if needed for confirmation
  return { success: true, data: { count: result.count, bots }, errors }
}

export async function updateBot(
  name: string,
  data: Partial<Bot>,
): Promise<{ success: boolean; data?: { bot: Bot }; message?: string }> {
  const botExists = await prisma.bot.findUnique({ where: { name } })

  if (!botExists) {
    return { success: false, message: 'Bot not found' }
  }

  const bot = await prisma.bot.update({
    where: { name },
    data: data as Prisma.BotUpdateInput,
  })
  return { success: true, data: { bot } }
}

export async function randomBot(): Promise<{
  success: boolean
  data?: { bot: Bot | null }
  message?: string
}> {
  const totalBots = await prisma.bot.count()

  if (totalBots === 0) {
    return { success: false, message: 'No bots available', data: { bot: null } }
  }

  const randomIndex = Math.floor(Math.random() * totalBots)
  const bot = await prisma.bot.findFirst({
    skip: randomIndex,
  })
  return { success: true, data: { bot } }
}

export async function updateBots(
  botsData: Partial<Bot>[],
): Promise<{ success: boolean; data: { updated: number }; errors: string[] }> {
  let updated = 0
  const errors: string[] = []

  for (const botData of botsData) {
    if (botData.name) {
      try {
        await updateBot(botData.name, botData)
        updated++
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        errors.push(
          `Failed to update bot with name ${botData.name}: ${errorMessage}`,
        )
      }
    } else {
      errors.push('Bot name is missing.')
    }
  }

  return { success: true, data: { updated }, errors }
}

export async function deleteBot(
  id: number,
): Promise<{ success: boolean; message?: string }> {
  const botExists = await prisma.bot.findUnique({ where: { id } })

  if (!botExists) {
    return { success: false, message: 'Bot not found' }
  }

  await prisma.bot.delete({ where: { id } })
  return { success: true, message: 'Bot deleted successfully' }
}

export async function countBots(): Promise<{
  success: boolean
  data: { count: number }
}> {
  const count = await prisma.bot.count()
  return { success: true, data: { count } }
}

export type { Bot }
