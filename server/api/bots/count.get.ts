// /server/api/bots/count.get.ts
import prisma from './../utils/prisma'

export default defineEventHandler(async () => {
  try {
    const count = await prisma.bot.count()
    return { success: true, count }
  } catch (error) {
    return { success: false, message: 'Failed to get bots count.' }
  }
})
