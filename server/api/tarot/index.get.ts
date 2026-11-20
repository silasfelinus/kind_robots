import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const decks = await prisma.tarotDeck.findMany({
      orderBy: { createdAt: 'asc' },
      include: { Cards: { orderBy: { ordinal: 'asc' } } },
    })
    return {
      success: true,
      statusCode: 200,
      message: 'Private tarot deck bible loaded.',
      data: decks,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
