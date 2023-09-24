// /server/api/milestones/fetchHighMatchScores.get.ts

import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const users = await prisma.user.findMany({
      where: {
        matchRecord: {
          gt: 0
        }
      },
      orderBy: {
        matchRecord: 'desc'
      },
      select: {
        id: true,
        username: true,
        matchRecord: true
      }
    })
    return { success: true, users }
  } catch (error: any) {
    return errorHandler(error)
  }
})
