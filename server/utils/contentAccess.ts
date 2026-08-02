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

/**
 * Shape needed to decide whether a user may see mature content.
 * `roles`/`UserRoles` are optional for the same reason they are everywhere
 * else: absent means "not loaded", so the primary column still answers.
 */
type MaturityUser = {
  id?: number | null
  Role?: string | null
  role?: string | null
  roles?: readonly string[] | null
  UserRoles?: readonly { role: string }[] | null
  showMature?: boolean | null
}

/**
 * Whether this user may be shown mature content.
 *
 * RESTRICTIVE WINS. This is the precedence rule for the whole multi-role
 * system, and mature content is where it first bites: a CHILD who is also an
 * ADMIN is still maturity-restricted. Admin grants capability; it does not lift
 * a safety restriction, and a role added for convenience must never be able to
 * unlock something a role added for protection closed.
 *
 * Silas, 2026-08-01, on wanting exactly that combination: "I can't make say, a
 * Child and Admin, or Family an Admin."
 *
 * Note the asymmetry with every other predicate here: elsewhere holding a role
 * GRANTS something, so any source of the role is enough. Here holding CHILD
 * DENIES something, so this deliberately consults the join table AND the legacy
 * column AND the lowercase `role` alias -- missing a CHILD marker in any of
 * them would fail open, which is the wrong direction for a child-safety check.
 *
 * A user with no `showMature` set is treated as not opted in.
 */
export function effectiveShowMature(
  user: MaturityUser | null | undefined,
): boolean {
  if (isMaturityRestricted(user)) return false
  return user?.showMature === true
}

/**
 * Is this user barred from mature content outright, whatever they ask for?
 *
 * The companion to effectiveShowMature, and the one that has to gate a
 * PER-REQUEST opt-in. Several routes accept `?showMature=true` and OR it with
 * the stored preference, so checking only the preference would let a CHILD
 * hand themselves mature content in a query string. A restriction that a query
 * parameter can lift is not a restriction.
 */
export function isMaturityRestricted(
  user: MaturityUser | null | undefined,
): boolean {
  if (!user) return true

  const roles = new Set<string>()
  for (const role of user.roles ?? []) roles.add(normalizeRole(role))
  for (const entry of user.UserRoles ?? []) roles.add(normalizeRole(entry?.role))
  roles.add(normalizeRole(user.Role))
  roles.add(normalizeRole(user.role))

  return roles.has('CHILD')
}

function normalizeRole(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
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
