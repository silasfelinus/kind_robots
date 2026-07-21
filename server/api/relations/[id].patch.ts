// /server/api/relations/[id].patch.ts
// PATCH /api/relations/:id — confirm a received request (status: 'ACCEPTED').
// Only the TARGET (relatedUserId) of a PENDING row may accept it; accepting
// creates the inverse row. Other status edits allowed by either party.

import prisma from '../../utils/prisma'
import { getCurrentUserId } from '../../utils/auth'
import { acceptPair } from '../../utils/relations'
import {
  createNotification,
  deleteFriendRequestNotifications,
} from '../../utils/notify'
import type { RelationStatus } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const userId = await getCurrentUserId(event)
  if (!userId) {
    setResponseStatus(event, 401)
    return { success: false, message: 'Not authenticated.' }
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    setResponseStatus(event, 400)
    return { success: false, message: 'Invalid relation id.' }
  }

  const existing = await prisma.userRelation.findUnique({ where: { id } })
  if (!existing) {
    setResponseStatus(event, 404)
    return { success: false, message: 'Relation not found.' }
  }

  const body = await readBody(event)
  const nextStatus = body?.status as RelationStatus | undefined

  const VALID_STATUSES: RelationStatus[] = ['PENDING', 'ACCEPTED', 'DECLINED']
  if (nextStatus !== undefined && !VALID_STATUSES.includes(nextStatus)) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'status must be one of PENDING, ACCEPTED, or DECLINED.',
    }
  }

  if (nextStatus === 'ACCEPTED') {
    // Only the recipient of a pending request may confirm it.
    if (existing.relatedUserId !== userId || existing.status !== 'PENDING') {
      setResponseStatus(event, 403)
      return {
        success: false,
        message: 'Only the recipient can accept this request.',
      }
    }
    const { acceptedRow, inverseRow } = await acceptPair(existing.id)
    await deleteFriendRequestNotifications({
      requesterId: existing.userId,
      recipientId: existing.relatedUserId,
      relationId: existing.id,
    })
    // Tell the original requester their request was accepted.
    if (existing.type === 'FRIEND') {
      const accepter = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      })
      await createNotification({
        userId: existing.userId,
        type: 'FRIEND_ACCEPT',
        title: `${accepter?.username ?? 'Someone'} accepted your friend request`,
        linkPath: '/friends',
        actorId: userId,
        entityId: acceptedRow.id,
      })
    }
    return {
      success: true,
      message: 'Relation accepted.',
      data: acceptedRow,
      inverse: inverseRow,
    }
  }

  // Any other status edit: either participant may touch the row — EXCEPT a
  // BLOCK, which is one-directional. Only the blocker (userId) may edit it, so
  // the blocked user (relatedUserId) cannot neutralize the block by flipping
  // its status/note (audit P6 MEDIUM).
  const isOwner = existing.userId === userId
  const isTarget = existing.relatedUserId === userId
  const canModify = existing.type === 'BLOCK' ? isOwner : isOwner || isTarget
  if (!canModify) {
    setResponseStatus(event, 403)
    return { success: false, message: 'You cannot modify this relation.' }
  }

  const data = await prisma.userRelation.update({
    where: { id },
    data: { status: nextStatus, note: body?.note ?? undefined },
  })

  return { success: true, message: 'Relation updated.', data }
})
