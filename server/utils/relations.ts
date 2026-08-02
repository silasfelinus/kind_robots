// /server/utils/relations.ts
//
// Shared helpers for the UserRelation API. Kept separate so the POST and PATCH
// handlers reuse the same accept/inverse logic.

import type { RelationType } from '~/prisma/generated/prisma/client'
import prisma from './prisma'
import { userHasRole } from './authUser'
import { addUserRole, removeUserRole } from './userRoleWrites'

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

// Roles whose DISPLAY label we are willing to change to CHILD. An elevated
// account keeps whatever primary role an admin gave it.
//
// This used to be a demotion guard: CHILD was written to the single `Role`
// column, so promoting an ADMIN would have stripped their permissions and the
// only safe move was to skip them entirely -- which is precisely the limitation
// Silas hit ("I can't make say, a Child and Admin"). With the join table the
// two facts are independent, so the guard shrinks to what it always meant.
const PROMOTABLE_ROLES = ['USER', 'GUEST']

// On accepting a PARENT/CHILD link, mark the child's account as CHILD. This is
// account-role automation, separate from the relation row itself.
async function applyChildRole(childId: number): Promise<void> {
  const child = await prisma.user.findUnique({
    where: { id: childId },
    select: { id: true, Role: true },
  })
  if (!child) return

  // Always additive -- an admin or designer who is also someone's child now
  // gets CHILD alongside what they already hold instead of being skipped.
  await addUserRole(childId, 'CHILD')

  // The primary role is a label, so only relabel a plain member. Silently
  // renaming an account an admin deliberately set is not this function's call.
  if (!PROMOTABLE_ROLES.includes(child.Role)) return

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
  // UserRoles is included so a user who holds CHILD only as a secondary role
  // -- the whole point of multi-role -- is still seen here. Selecting `Role`
  // alone would skip the revert and strand them as a child forever.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, Role: true, UserRoles: { select: { role: true } } },
  })
  if (!user || !userHasRole(user, 'CHILD')) return

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

  // Drop the join-table row unconditionally; only reset the primary label if
  // CHILD is what it currently says. An admin who was also a child keeps
  // ADMIN as their primary and simply stops being a child.
  await removeUserRole(userId, 'CHILD')
  if (String(user.Role).toUpperCase() !== 'CHILD') return

  await prisma.user.update({
    where: { id: userId },
    data: { Role: 'USER' },
  })
}
