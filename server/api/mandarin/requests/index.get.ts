import { defineEventHandler } from 'h3'
import { requireApiUser } from '../../../utils/authGuard'
import { errorHandler } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'
import {
  reconcileRequestedCardArt,
  requestedCardPublicDataEnriched,
} from '../../../utils/mandarinRequestedCards'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const rows = await prisma.mandarinRequestedCard.findMany({
      where: {
        userId: auth.user.id,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const reconciled = await Promise.all(
      rows.map((row) => reconcileRequestedCardArt(row)),
    )
    const publicCards = await Promise.all(
      reconciled.map((row) => requestedCardPublicDataEnriched(row)),
    )

    return {
      success: true,
      statusCode: 200,
      message: 'Requested Mandarin cards loaded.',
      data: {
        cards: publicCards,
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load requested Mandarin cards.',
    }
  }
})
