// /server/api/users/directory.get.ts
// Public user directory for the friend-finder. Respects consent + safety:
// - only users who opted in (listInDirectory) and are active + not restricted
// - hides guests and the viewer themselves
// - if a viewer is known, hides anyone blocked in either direction
// Supports ?search= (username/name/designerName contains).
import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)
    const viewerId = auth?.user.id ?? null
    const search = String(getQuery(event).search || '').trim()

    const excludeIds = new Set<number>([10]) // guest sentinel
    if (viewerId) {
      excludeIds.add(viewerId)
      const blocks = await prisma.userRelation.findMany({
        where: {
          type: 'BLOCK',
          OR: [{ userId: viewerId }, { relatedUserId: viewerId }],
        },
        select: { userId: true, relatedUserId: true },
      })
      for (const b of blocks) {
        excludeIds.add(b.userId === viewerId ? b.relatedUserId : b.userId)
      }
    }

    const users = await prisma.user.findMany({
      where: {
        listInDirectory: true,
        isActive: true,
        isRestricted: false,
        id: { notIn: [...excludeIds] },
        ...(search
          ? {
              OR: [
                { username: { contains: search } },
                { name: { contains: search } },
                { designerName: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { username: 'asc' },
      take: 100,
      select: {
        id: true,
        username: true,
        designerName: true,
        avatarImage: true,
        artImageId: true,
        bio: true,
        Role: true,
        allowFriendRequests: true,
        messagePolicy: true,
      },
    })

    return { success: true, data: users }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to load directory.',
      data: [],
    }
  }
})
