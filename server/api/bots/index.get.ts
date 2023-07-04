// server/api/bots/index.get.ts
import prisma from '../prisma'

export default defineEventHandler(async () => {
  const bots = await prisma.bot.findMany({})
  return await bots
})
