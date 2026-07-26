// /server/utils/contentAccess.ts
// Shared access-check helpers for the Grant model (SHARING-SPEC.md,
// pitches/2026-07-17-sharing-grant-model.md, kind-robots/t-044). New file
// only — no existing route is rewired onto this yet; that happens
// incrementally as routes are touched (per the pitch's own scoping).
import prisma from './prisma'
import { GrantLevel, type GrantSubject } from '~/prisma/generated/prisma/client'
import { userIsAdmin } from './authUser'

/** Minimal shape any Grant-gateable row (Project, Resource, ...) must satisfy. */
export type AccessSubject = {
  id: number
  userId: number | null
  isPublic: boolean
}

type AccessUser = {
  id: number
  Role?: string | null
  isAdmin?: boolean
}

const GRANT_LEVEL_RANK: Record<GrantLevel, number> = {
  [GrantLevel.VIEW]: 1,
  [GrantLevel.ADMIN]: 2,
}

function isAdminUser(user: AccessUser): boolean {
  return typeof user.isAdmin === 'boolean' ? user.isAdmin : userIsAdmin(user)
}

/**
 * Is there an ACTIVE, unexpired Grant giving `userId` at least `minLevel`
 * access to `subjectType`:`subjectId`? Defaults to VIEW. A GrantStatus other
 * than ACTIVE, or a past expiresAt, never counts — even if a sweep hasn't yet
 * flipped a lapsed row's status to EXPIRED.
 */
export async function existsActiveGrant(
  userId: number,
  subjectType: GrantSubject,
  subjectId: number,
  minLevel: GrantLevel = GrantLevel.VIEW,
): Promise<boolean> {
  const qualifyingLevels = (
    Object.keys(GRANT_LEVEL_RANK) as GrantLevel[]
  ).filter((level) => GRANT_LEVEL_RANK[level] >= GRANT_LEVEL_RANK[minLevel])

  const grant = await prisma.grant.findFirst({
    where: {
      granteeId: userId,
      subjectType,
      subjectId,
      status: 'ACTIVE',
      level: { in: qualifyingLevels },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  })

  return grant !== null
}

/**
 * Does `user` have at-least-VIEW access to `subject`? `subjectType` is passed
 * explicitly rather than inferred, since Project/Resource rows carry no
 * discriminator of their own — it's purely a property of which Grant bucket
 * applies to this call site.
 *
 * subject.isPublic OR subject.userId === user.id OR user is admin OR an
 * active Grant exists — the formula from the Grant-model pitch.
 */
export async function canView(
  subject: AccessSubject,
  subjectType: GrantSubject,
  user: AccessUser | null | undefined,
): Promise<boolean> {
  if (subject.isPublic) return true
  if (!user) return false
  if (subject.userId !== null && subject.userId === user.id) return true
  if (isAdminUser(user)) return true

  return existsActiveGrant(user.id, subjectType, subject.id, GrantLevel.VIEW)
}
