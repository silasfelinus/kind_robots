// /server/api/store/entitlements.get.ts
// Returns the caller's own active entitlement product slugs (SPEC.md §5,
// digital-storefront t-023) — the front end uses this to decide Buy vs.
// Download without needing to know Entitlement's internal shape. Also the
// intended gate for future DLC unlocks (a feature/route check rather than a
// file download), per SPEC.md §5's closing paragraph.
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)

    const entitlements = await prisma.entitlement.findMany({
      where: { userId: user.id, revokedAt: null },
      select: { Product: { select: { slug: true } } },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      data: {
        slugs: entitlements.map((entitlement) => entitlement.Product.slug),
      },
      message: '🎟️ Entitlements loaded',
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    if (statusCode >= 500) {
      console.error('Loading entitlements failed:', error)
    }

    event.node.res.statusCode = statusCode

    return {
      success: false,
      data: null,
      message: handled.message || '😵 Failed to load entitlements',
      statusCode,
    }
  }
})
