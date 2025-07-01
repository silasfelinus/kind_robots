// /server/api/hybrids/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'

export default defineEventHandler(async () => {
  const data = await prisma.hybrid.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      art: true,
      user: true,
    },
  })

  return {
    success: true,
    message: 'Hybrids fetched successfully.',
    data,
    statusCode: 200,
  }
})
