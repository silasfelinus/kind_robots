// /server/api/milestones/fetchHighClickScores.get.ts

import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const users = await prisma.user.findMany({
      where: {
        clickRecord: {
          gt: 0,
        },
      },
      orderBy: {
        clickRecord: 'desc',
      },
      select: {
        id: true,
        username: true,
        clickRecord: true,
      },
    })
    return { success: true, users }
  }
  catch (error: any) {
    return errorHandler(error)
  }
})
