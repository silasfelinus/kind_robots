// /server/api/users/admin/index.get.ts
// Admin-only roster with the moderation fields the public /api/users omits
// (email, verification, restriction, role). Never returns password/token/apiKey.
import { defineEventHandler } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        Role: true,
        emailVerified: true,
        showMature: true,
        isPublic: true,
        isActive: true,
        isRestricted: true,
        restrictedReason: true,
        listInDirectory: true,
        messagePolicy: true,
        newsletterFrequency: true,
        newsletterConfirmedAt: true,
        avatarImage: true,
        artImageId: true,
        createdAt: true,
      },
    })

    return { success: true, message: 'Roster loaded.', data: users }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Failed to load roster.', data: [] }
  }
})
