// /server/api/relations/[id].delete.ts
// DELETE /api/relations/:id — reject a request, cancel one you sent, unfriend,
// or unblock. Removes BOTH halves of an accepted pair (via pairId).

import prisma from '../../utils/prisma'
import { getCurrentUserId } from '../../utils/auth'
import { maybeRevertChildRole } from '../../utils/relations'

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
    // Already gone — treat as success so cleanup/idempotency is easy.
    return { success: true, message: 'Relation already removed.', data: { id } }
  }

  if (existing.userId !== userId && existing.relatedUserId !== userId) {
    setResponseStatus(event, 403)
    return { success: false, message: 'You cannot delete this relation.' }
  }

  // If this is a family link, note who the child was so we can revert their
  // role after deletion (only if they have no remaining family links).
  let childToCheck: number | null = null
  if (existing.type === 'PARENT') childToCheck = existing.relatedUserId
  else if (existing.type === 'CHILD') childToCheck = existing.userId

  // Remove both halves if this row is part of an accepted pair.
  if (existing.pairId) {
    await prisma.userRelation.deleteMany({
      where: {
        OR: [
          { id: existing.id },
          { id: existing.pairId },
          { pairId: existing.pairId },
        ],
      },
    })
  } else {
    await prisma.userRelation.delete({ where: { id } })
  }

  // Revert CHILD role only if no family links remain for that user.
  if (childToCheck) await maybeRevertChildRole(childToCheck)

  return { success: true, message: 'Relation removed.', data: { id } }
})
