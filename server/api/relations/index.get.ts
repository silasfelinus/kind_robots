// /server/api/relations/index.get.ts
// GET /api/relations — every relation touching the current user (both sides).

import prisma from '../../utils/prisma'
import { getCurrentUserId } from './../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getCurrentUserId(event)
  if (!userId) {
    setResponseStatus(event, 401)
    return { success: false, message: 'Not authenticated.', data: [] }
  }

  const data = await prisma.userRelation.findMany({
    where: { OR: [{ userId }, { relatedUserId: userId }] },
    orderBy: { createdAt: 'desc' },
  })

  return { success: true, message: 'Relations retrieved.', data }
})
