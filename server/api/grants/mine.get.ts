import { defineEventHandler } from 'h3'
import { requireApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const grants = await prisma.grant.findMany({
      where: {
        granteeId: user.id,
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: grants, statusCode: 200 }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Failed to list shared content.', data: null, statusCode: event.node.res.statusCode }
  }
})
