// ~/server/api/bots/index.ts
import type { Prisma } from '@prisma/client'
import type { Bot } from '@prisma/client'
import prisma from './../utils/prisma'

export async function fetchBots(page = 1, pageSize = 100): Promise<Bot[]> {
  const skip = (page - 1) * pageSize
  return await prisma.bot.findMany({
    skip,
    take: pageSize,
  })
}

export async function fetchBotById(id: number): Promise<Bot | null> {
  return await prisma.bot.findUnique({
    where: { id },
  })
}

export async function fetchBotByName(name: string): Promise<Bot | null> {
  return await prisma.bot.findUnique({
    where: { name },
  })
}

export async function addBots(botsData: Partial<Bot>[]): Promise<{ count: number, bots: Bot[], errors: string[] }> {
  const errors: string[] = []
  const data: Prisma.BotCreateManyInput[] = botsData
    .filter((botData) => {
      if (!botData.name) {
        errors.push(`Bot with ID ${botData.id} does not have a name.`)
        return false
      }
      return true
    })
    .map(botData => botData as Prisma.BotCreateManyInput)

  const result = await prisma.bot.createMany({
    data,
    skipDuplicates: true,
  })

  const bots = await fetchBots()

  return { count: result.count, bots, errors }
}

export async function updateBot(name: string, data: Partial<Bot>): Promise<Bot | null> {
  const botExists = await prisma.bot.findUnique({ where: { name } })

  if (!botExists) {
    return null
  }

  return await prisma.bot.update({
    where: { name },
    data: data as Prisma.BotUpdateInput,
  })
}

export async function updateBots(botsData: Partial<Bot>[]): Promise<{ updated: number, errors: string[] }> {
  let updated = 0
  const errors: string[] = []

  for (const botData of botsData) {
    if (botData.name) {
      try {
        await updateBot(botData.name, botData)
        updated++
      }
      catch (error: any) {
        errors.push(`Failed to update bot with name ${botData.name}: ${error.message}`)
      }
    }
    else {
      errors.push('Bot name is missing.')
    }
  }

  return { updated, errors }
}

export async function deleteBot(id: number): Promise<boolean> {
  const botExists = await prisma.bot.findUnique({ where: { id } })

  if (!botExists) {
    return false
  }

  await prisma.bot.delete({ where: { id } })
  return true
}

export async function randomBot(): Promise<Bot | null> {
  const totalBots = await prisma.bot.count()

  if (totalBots === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * totalBots)
  return await prisma.bot.findFirst({
    skip: randomIndex,
  })
}

export async function countBots(): Promise<number> {
  return await prisma.bot.count()
}

export type { Bot }
