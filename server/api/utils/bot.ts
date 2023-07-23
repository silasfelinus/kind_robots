// /server/api/utils/bot.ts
import { Prisma } from '@prisma/client'
import { Bot } from '../../../types/bot'
import prisma from './prisma'
import { ErrorHandler } from './error'

export const createManyBots = async (botsData: Partial<Bot>[]): Promise<{ count: number }> => {
  return await ErrorHandler(async () => {
    const data: Prisma.BotCreateManyInput[] = botsData.map((botData) => {
      if (!botData.name) {
        throw new Error(`Each bot must have a name.`)
      }
      return botData as Prisma.BotCreateManyInput
    })

    const result = await prisma.bot.createMany({
      data,
      skipDuplicates: true
    })

    return { count: result.count }
  }, 'Error while creating multiple bots')
}

// Fetches a bot from the database using its ID
export const findBot = async (id: number): Promise<Bot> => {
  return ErrorHandler(async () => {
    const bot = await prisma.bot.findUnique({ where: { id } })
    if (!bot) {
      throw new Error('Bot not found.')
    }
    return bot
  }, 'Error while finding a bot')
}

// Updates a bot in the database using its ID and the provided data
export const updateBot = async (id: number, data: Partial<Bot>): Promise<Bot> => {
  return ErrorHandler(async () => {
    return await prisma.bot.update({
      where: { id },
      data
    })
  }, 'Error while updating a bot')
}

// Fetches a random bot from the database
export const randomBot = async (): Promise<Bot> => {
  return ErrorHandler(async () => {
    const totalBots = await prisma.bot.count()
    const randomIndex = Math.floor(Math.random() * totalBots)
    const randomBot = await prisma.bot.findFirst({
      skip: randomIndex
    })

    if (!randomBot) {
      throw new Error('Bot not found.')
    }

    return randomBot
  }, 'Error while finding a random bot')
}

// Deletes a bot from the database using its ID
export const deleteBot = async (id: number): Promise<Bot> => {
  return ErrorHandler(async () => {
    return await prisma.bot.delete({ where: { id } })
  }, 'Error while deleting a bot')
}

// Fetches all bots from the database
export const getBots = async (): Promise<Bot[]> => {
  return ErrorHandler(async () => {
    return await prisma.bot.findMany()
  }, 'Error while retrieving bots')
}

// Counts the total number of bots in the database
export const countBots = async (): Promise<number> => {
  return ErrorHandler(async () => {
    return await prisma.bot.count()
  }, 'Error while counting bots')
}
