// /server/api/random/[id].delete.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const isDeleted = await prisma.randomList.delete({ where: { id } })
    return { success: true }
  }
  catch (error: any) {
    return errorHandler(error)
  }
})
