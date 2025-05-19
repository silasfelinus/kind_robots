import prisma from '@/server/api/utils/prisma'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const themes = await prisma.theme.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
  })
  return { success: true, themes, statusCode: 200 }
})
