// ~/server/api/bots/index.ts
//
// Helper module for the bots routes -- no default export, so Nitro does not
// serve it. fetchBots/fetchBotById/fetchBotByName/randomBot used to live here
// and returned every Bot with no `where` at all, private and mature alike.
// Nothing called them (index.get.ts queries directly, through
// visibilityWhere), so they are gone rather than guarded: an unfiltered read
// helper with no callers is a loaded gun for the next endpoint that reaches
// for it.
import type { Prisma, Bot } from '~/prisma/generated/prisma/client'
import prisma from '../../utils/prisma'




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
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message }
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
        errors.push('Bot with missing name.')
        return false
      }

      return true
    })
    .map((botData) => botData as Prisma.BotCreateManyInput)

  const result = await prisma.bot.createMany({
    data,
    skipDuplicates: true,
  })

  const bots = await prisma.bot.findMany()

  return { success: true, data: { count: result.count, bots }, errors }
}

export async function updateBot(
  name: string,
  data: Partial<Bot>,
): Promise<{ success: boolean; data?: { bot: Bot }; message?: string }> {
  const botExists = await prisma.bot.findFirst({
    where: { name },
  })

  if (!botExists) {
    return { success: false, message: 'Bot not found' }
  }

  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...updateData
  } = data

  const bot = await prisma.bot.update({
    where: { id: botExists.id },
    data: updateData as Prisma.BotUpdateInput,
  })

  return { success: true, data: { bot } }
}


export async function updateBots(
  botsData: Partial<Bot>[],
): Promise<{ success: boolean; data: { updated: number }; errors: string[] }> {
  let updated = 0
  const errors: string[] = []

  for (const botData of botsData) {
    if (!botData.name) {
      errors.push('Bot name is missing.')
      continue
    }

    try {
      const result = await updateBot(botData.name, botData)

      if (result.success) {
        updated++
      } else {
        errors.push(
          `Failed to update bot with name ${botData.name}: ${result.message}`,
        )
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Failed to update bot with name ${botData.name}: ${message}`)
    }
  }

  return { success: true, data: { updated }, errors }
}

export async function deleteBot(
  id: number,
): Promise<{ success: boolean; message?: string }> {
  const botExists = await prisma.bot.findUnique({
    where: { id },
  })

  if (!botExists) {
    return { success: false, message: 'Bot not found' }
  }

  await prisma.bot.delete({
    where: { id },
  })

  return { success: true, message: 'Bot deleted successfully' }
}

/**
 * Counts bots the caller may actually see. `where` comes from
 * visibilityWhere() at the route, so the count agrees with the listing instead
 * of quietly reporting how many private bots exist.
 */
export async function countBots(
  where: Prisma.BotWhereInput = {},
): Promise<{
  success: boolean
  data: { count: number }
}> {
  const count = await prisma.bot.count({ where })

  return { success: true, data: { count } }
}

export type { Bot }
