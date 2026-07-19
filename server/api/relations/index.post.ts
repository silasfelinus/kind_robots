// /server/api/relations/index.post.ts
// POST /api/relations — create a relation REQUEST.
// Body: { relatedUserId, type, note? }
//
// BLOCK is created immediately as ACCEPTED (no consent, no inverse).
// All other types are created as PENDING for relatedUserId to confirm.
// FRIEND only: a matching reverse pending FRIEND request auto-accepts.

import prisma from '../../utils/prisma'
import { getCurrentUserId } from '../../utils/auth'
import { acceptPair } from '../../utils/relations'
import { createNotification } from '../../utils/notify'
import type { RelationType } from '~/prisma/generated/prisma/client'

const VALID_TYPES: RelationType[] = [
  'FRIEND',
  'BLOCK',
  'PARENT',
  'CHILD',
  'REFEREE',
]

export default defineEventHandler(async (event) => {
  const userId = await getCurrentUserId(event)
  if (!userId) {
    setResponseStatus(event, 401)
    return { success: false, message: 'Not authenticated.' }
  }

  const body = await readBody(event)
  const relatedUserId = Number(body?.relatedUserId)
  const type = String(body?.type) as RelationType

  if (!relatedUserId || relatedUserId === userId) {
    setResponseStatus(event, 400)
    return { success: false, message: 'Invalid relatedUserId.' }
  }
  if (!VALID_TYPES.includes(type)) {
    setResponseStatus(event, 400)
    return { success: false, message: `Invalid relation type: ${type}.` }
  }

  // BLOCK: immediate, no request, no inverse.
  if (type === 'BLOCK') {
    // Confirm the target exists first; otherwise the upsert trips the
    // relatedUserId foreign key and surfaces as an unhandled 500 (P2003).
    const target = await prisma.user.findUnique({
      where: { id: relatedUserId },
      select: { id: true },
    })
    if (!target) {
      setResponseStatus(event, 404)
      return { success: false, message: 'User not found.' }
    }

    const data = await prisma.userRelation.upsert({
      where: {
        userId_relatedUserId_type: { userId, relatedUserId, type },
      },
      create: { userId, relatedUserId, type, status: 'ACCEPTED' },
      update: { status: 'ACCEPTED' },
    })
    setResponseStatus(event, 201)
    return { success: true, message: 'User blocked.', data }
  }

  // Look up the requester once for notification labels + the target's consent.
  const [me, target] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    }),
    prisma.user.findUnique({
      where: { id: relatedUserId },
      select: { username: true, allowFriendRequests: true },
    }),
  ])
  if (!target) {
    setResponseStatus(event, 404)
    return { success: false, message: 'User not found.' }
  }

  // Respect the target's consent to receive friend requests.
  if (type === 'FRIEND' && target.allowFriendRequests === false) {
    setResponseStatus(event, 403)
    return {
      success: false,
      message: 'This user is not accepting friend requests.',
    }
  }

  // FRIEND only: if the target already sent ME a pending FRIEND request, both
  // sides consent, so complete the friendship instead of stacking a second
  // row. PARENT/CHILD/REFEREE require an explicit accept and skip this.
  if (type === 'FRIEND') {
    const reverse = await prisma.userRelation.findFirst({
      where: {
        userId: relatedUserId,
        relatedUserId: userId,
        type: 'FRIEND',
        status: 'PENDING',
      },
    })
    if (reverse) {
      const { acceptedRow } = await acceptPair(reverse.id)
      // Both are now friends — tell the person who asked first.
      await createNotification({
        userId: relatedUserId,
        type: 'FRIEND_ACCEPT',
        title: `${me?.username ?? 'Someone'} accepted your friend request`,
        linkPath: '/friends',
        actorId: userId,
      })
      setResponseStatus(event, 200)
      return {
        success: true,
        message: 'Friend request accepted.',
        data: acceptedRow,
        pairCreated: true,
      }
    }
  }

  // Fresh request → PENDING.
  const data = await prisma.userRelation.upsert({
    where: {
      userId_relatedUserId_type: { userId, relatedUserId, type },
    },
    create: {
      userId,
      relatedUserId,
      type,
      status: 'PENDING',
      note: body?.note ?? null,
    },
    update: { status: 'PENDING', note: body?.note ?? undefined },
  })

  // Notify the target that a request is waiting on them.
  if (type === 'FRIEND') {
    await createNotification({
      userId: relatedUserId,
      type: 'FRIEND_REQUEST',
      title: `${me?.username ?? 'Someone'} sent you a friend request`,
      linkPath: '/friends',
      actorId: userId,
    })
  }

  setResponseStatus(event, 201)
  return { success: true, message: 'Relation request created.', data }
})
