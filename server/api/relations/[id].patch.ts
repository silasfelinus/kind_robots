// /server/api/relations/[id].patch.ts
// PATCH /api/relations/:id — confirm a received request (status: 'ACCEPTED').
// Only the TARGET (relatedUserId) of a PENDING row may accept it; accepting
// creates the inverse row. Other status edits allowed by either party.

import prisma from '../../utils/prisma'
import { getCurrentUserId } from '../../utils/auth'
import { acceptPair } from '../../utils/relations'
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
    return {
      success: true,
      message: 'Relation accepted.',
      data: acceptedRow,
      inverse: inverseRow,
    }
  }

  // Any other status edit: either participant may touch the row.
  if (existing.userId !== userId && existing.relatedUserId !== userId) {
    setResponseStatus(event, 403)
    return { success: false, message: 'You cannot modify this relation.' }
  }

  const data = await prisma.userRelation.update({
    where: { id },
    data: { status: nextStatus, note: body?.note ?? undefined },
  })

  return { success: true, message: 'Relation updated.', data }
})
