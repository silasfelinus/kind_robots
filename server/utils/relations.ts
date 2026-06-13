// /server/utils/relations.ts
//
// Shared helpers for the UserRelation API. Kept separate so the POST and PATCH
// handlers reuse the same accept/inverse logic.

import type { RelationType } from '~/prisma/generated/prisma/client'
import prisma from './prisma'

// The inverse role for the OTHER user when a relation is accepted.
// FRIEND is symmetric; PARENT/CHILD swap; REFEREE/BLOCK have no owned inverse.
export function inverseType(type: RelationType): RelationType {
  switch (type) {
    case 'FRIEND':
      return 'FRIEND'
    case 'PARENT':
      return 'CHILD'
    case 'CHILD':
      return 'PARENT'
    default:
      return type
  }
}

// Whether accepting a relation of this type should create an inverse row.
export function makesInverse(type: RelationType): boolean {
  return type === 'FRIEND' || type === 'PARENT' || type === 'CHILD'
}

// Given a PARENT/CHILD relation row, returns the id of the user who is the
// CHILD in the relationship. For a PARENT row, userId is the parent and
// relatedUserId is the child; for a CHILD row it's the reverse.
function childIdFromRow(row: {
  type: RelationType
  userId: number
  relatedUserId: number
}): number | null {
  if (row.type === 'PARENT') return row.relatedUserId
  if (row.type === 'CHILD') return row.userId
  return null
}

// Roles we will NOT overwrite when promoting a child — clobbering an elevated
// account to CHILD would strip permissions. Only plain members get promoted.
const PROMOTABLE_ROLES = ['USER', 'GUEST']

// On accepting a PARENT/CHILD link, mark the child's account Role as CHILD
// (only if they're a plain USER/GUEST, so we never demote an ADMIN/DESIGNER).
// This is account-role automation, separate from the relation row itself.
async function applyChildRole(childId: number): Promise<void> {
  const child = await prisma.user.findUnique({
    where: { id: childId },
    select: { id: true, Role: true },
  })
  if (!child) return
  if (!PROMOTABLE_ROLES.includes(child.Role)) return // don't demote elevated roles

  await prisma.user.update({
    where: { id: childId },
    data: { Role: 'CHILD' },
  })
}

// Accept a pending relation by id: flip to ACCEPTED, stamp pairId, and create
// the inverse row (when the type has one). Both halves share pairId so a
// later delete can remove the pair together. For PARENT/CHILD links, also
// promotes the child's account Role to CHILD.
export async function acceptPair(rowId: number) {
  const row = await prisma.userRelation.findUnique({ where: { id: rowId } })
  if (!row) throw new Error('Relation not found')

  const acceptedRow = await prisma.userRelation.update({
    where: { id: rowId },
    data: { status: 'ACCEPTED', pairId: rowId },
  })

  let inverseRow = null
  if (makesInverse(row.type)) {
    inverseRow = await prisma.userRelation.upsert({
      where: {
        userId_relatedUserId_type: {
          userId: row.relatedUserId,
          relatedUserId: row.userId,
          type: inverseType(row.type),
        },
      },
      create: {
        userId: row.relatedUserId,
        relatedUserId: row.userId,
        type: inverseType(row.type),
        status: 'ACCEPTED',
        pairId: rowId,
      },
      update: { status: 'ACCEPTED', pairId: rowId },
    })
  }

  // Account-role automation for family links.
  if (row.type === 'PARENT' || row.type === 'CHILD') {
    const childId = childIdFromRow(row)
    if (childId) await applyChildRole(childId)
  }

  return { acceptedRow, inverseRow }
}

// Called from the DELETE handler when a relation is removed. If a user no
// longer has ANY accepted PARENT/CHILD link where they're the child, revert
// their CHILD role back to USER. Safe with multiple parents: only reverts
// once the last family link is gone. Never touches non-CHILD roles.
export async function maybeRevertChildRole(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, Role: true },
  })
  if (!user || user.Role !== 'CHILD') return

  // Any remaining accepted link where this user is the child?
  const stillChild = await prisma.userRelation.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { type: 'CHILD', userId }, // they own a CHILD row
        { type: 'PARENT', relatedUserId: userId }, // someone parents them
      ],
    },
  })
  if (stillChild) return // still a child of someone — leave role alone

  await prisma.user.update({
    where: { id: userId },
    data: { Role: 'USER' },
  })
}
