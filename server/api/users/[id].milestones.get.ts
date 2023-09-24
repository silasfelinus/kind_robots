// /server/api/users/[id].milestones.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '@/server/api/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    const milestoneRecords = await prisma.milestoneRecord.findMany({
      where: { userId: id },
      select: {
        milestoneId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ milestoneRecords })
    }
  } catch (error: any) {
    const { message } = errorHandler(error)
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message })
    }
  }
})
