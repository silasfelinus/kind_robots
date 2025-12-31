// /server/api/dominions/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Optional filters: ?userId=10&publicOnly=true&setId=fanpack&search=draw
    const q = getQuery(event)
    const userId = q.userId ? Number(q.userId) : undefined
    const publicOnly = String(q.publicOnly ?? '') === 'true'
    const setId = (q.setId as string) || undefined
    const search = (q.search as string) || undefined

    const where: any = {}
    if (typeof userId === 'number' && !Number.isNaN(userId))
      where.userId = userId
    if (publicOnly) where.isPublic = true
    if (setId) where.setId = setId
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { italics: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const data = await prisma.dominion.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Dominions fetched.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    return errorHandler(error)
  }
})
