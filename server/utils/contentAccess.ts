// /server/utils/contentAccess.ts
// Shared access-check helpers for the Grant model (SHARING-SPEC.md,
// pitches/2026-07-17-sharing-grant-model.md, kind-robots/t-044). Extended in
// kind-robots/t-050 (pitches/2026-07-18-pack-model-dlc-unlocks.md) to also
// cover Pack-gated content (Dream, Facet, Character, Reward's nullable
// packId) via GrantSubject.PACK — no route is rewired onto the packId path
// yet, that's a separate follow-on (digital-storefront's DLC fulfillment).
import prisma from './prisma'
import { GrantLevel, type GrantSubject } from '~/prisma/generated/prisma/client'
import { userIsAdmin } from './authUser'

/**
 * Minimal shape any Grant-gateable row must satisfy. `packId` is optional —
 * present (and possibly non-null) on Pack-member content (Dream, Facet,
 * Character, Reward); absent on rows like Project/Resource that only carry
 * their own `subjectType`-based grant.
 */
export type AccessSubject = {
  id: number
  userId: number | null
  isPublic: boolean
  packId?: number | null
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
 * applies to this call site. Pass `null` for content that is only ever
 * Pack-gated (no `subjectType`-based grant bucket of its own) — `subject.id`
 * is then unused for grant lookup and only `packId` is checked.
 *
 * subject.isPublic OR subject.userId === user.id OR user is admin OR an
 * active `subjectType` Grant exists OR (subject.packId is set AND an active
 * PACK Grant exists for it) — the formula from the Grant-model pitch,
 * extended for Pack-gated content per the Pack-model pitch.
 */
export async function canView(
  subject: AccessSubject,
  subjectType: GrantSubject | null,
  user: AccessUser | null | undefined,
): Promise<boolean> {
  if (subject.isPublic) return true
  if (!user) return false
  if (subject.userId !== null && subject.userId === user.id) return true
  if (isAdminUser(user)) return true

  if (
    subjectType &&
    (await existsActiveGrant(user.id, subjectType, subject.id, GrantLevel.VIEW))
  ) {
    return true
  }

  if (subject.packId != null) {
    return existsActiveGrant(user.id, 'PACK', subject.packId, GrantLevel.VIEW)
  }

  return false
}
