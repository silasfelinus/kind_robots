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
 * May this viewer be shown mature content on THIS request?
 *
 * THE ONE PREDICATE. Silas, 2026-09-18, settling where the rule lives: "if
 * something is mature but public, it should still only be seen by a logged in
 * user that has chosen mature true. there shouldn't be an option for this to
 * bleed... the backend is the proper place to gate this behavior."
 *
 * Three conditions, and all three are the SERVER's:
 *
 *   logged in      anonymous callers never see mature content. effectiveShowMature
 *                  reads `showMature` off a user; there is no user, so it is false.
 *   not a CHILD    a restriction a role adds, that no preference or parameter lifts.
 *   opted in       the stored preference, set through the maturity toggle, which
 *                  persists to /api/users/me/consent and only renders for a
 *                  logged-in, non-restricted account.
 *
 * `requested` is the per-request `?showMature=` parameter, and it may only
 * NARROW. It used to widen -- getArtImageAccessContext read
 * `requestedMature || user.showMature`, so an adult with the toggle OFF could
 * hand themselves mature images with a query string. That is the bleed: a
 * preference a caller can override is not a preference, the same way a
 * restriction a caller can lift is not a restriction.
 *
 * A surface that never wants mature content passes `false` and gets that.
 * Nothing can pass `true` and get more than the account already allows.
 */
export function viewerShowsMature(
  user: MaturityUser | null | undefined,
  requested?: boolean,
): boolean {
  if (!effectiveShowMature(user)) return false
  return requested !== false
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
  for (const entry of user.UserRoles ?? [])
    roles.add(normalizeRole(entry?.role))
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

function qualifyingGrantLevels(minLevel: GrantLevel): GrantLevel[] {
  return (Object.keys(GRANT_LEVEL_RANK) as GrantLevel[]).filter(
    (level) => GRANT_LEVEL_RANK[level] >= GRANT_LEVEL_RANK[minLevel],
  )
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
  const grant = await prisma.grant.findFirst({
    where: {
      granteeId: userId,
      subjectType,
      subjectId,
      status: 'ACTIVE',
      level: { in: qualifyingGrantLevels(minLevel) },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  })

  return grant !== null
}

export async function viewablePackIds(userId: number): Promise<number[]> {
  return grantedSubjectIds(userId, 'PACK')
}

/** Subject ids of a given type this user holds an active VIEW-or-better grant on. */
export async function grantedSubjectIds(
  userId: number,
  subjectType: GrantSubject,
): Promise<number[]> {
  const grants = await prisma.grant.findMany({
    where: {
      granteeId: userId,
      subjectType,
      status: 'ACTIVE',
      level: { in: qualifyingGrantLevels(GrantLevel.VIEW) },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { subjectId: true },
  })

  return Array.from(new Set(grants.map((grant) => grant.subjectId)))
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
/*
 * THE VISIBILITY RULE, AS A PRISMA FRAGMENT.
 *
 * Silas, 2026-09-17, stating it as one rule for the whole site: "a mature
 * object should not even look like it exists for children accounts"; "a private
 * object should not show up AT ALL for non-admin non-owners. they don't exist";
 * "this should be an api barrier, not a front end barrier".
 *
 * It was a front-end barrier in places, and in several listings it was no
 * barrier at all -- `prisma.prompt.findMany()` with no `where`, and
 * `prisma.bot.findMany({ skip, take })` returning every bot including private
 * and mature ones. 23 models carry these flags and the guard was applied ad hoc
 * per endpoint, so this exists to be applied once per listing rather than
 * reasoned about again each time.
 *
 * Two independent conditions, both AND-ed in:
 *
 *   private  -> the owner, or an admin. Not "hidden from" others: absent for
 *               them, because withholding the picture while publishing the fact
 *               of it is not privacy.
 *   mature   -> excluded outright for a maturity-restricted account, which
 *               viewerShowsMature decides from ROLES rather than from the
 *               `showMature` preference, so a CHILD cannot opt themselves in
 *               with a query parameter.
 *
 * An admin sees everything here. Overriding another person's privacy choice is
 * a deliberate act in the UI rather than something this fragment withholds --
 * moderation needs to be able to see what it moderates.
 */
export type VisibilityFields = {
  /** The model has an `isPublic` column. */
  isPublic?: boolean
  /** The model has an `isMature` column. */
  isMature?: boolean
  /** Owner column, when it is not `userId`. */
  ownerField?: string
  /** The model has a `packId`: Reward, Character, Dream, Facet. */
  packGated?: boolean
  /** The model has its own Grant bucket: PROJECT or RESOURCE. */
  grantSubject?: GrantSubject
}

export async function visibilityWhere(
  user: (MaturityUser & { id?: number | null }) | null | undefined,
  fields: VisibilityFields = { isPublic: true, isMature: true },
  isAdmin = false,
  /** The per-request `?showMature=` parameter. May only narrow. */
  showMature?: boolean,
): Promise<Record<string, unknown>> {
  const clauses: Record<string, unknown>[] = []
  const ownerField = fields.ownerField ?? 'userId'
  const viewerId = typeof user?.id === 'number' ? user.id : null

  if (fields.isPublic && !isAdmin) {
    if (viewerId === null) {
      clauses.push({ isPublic: true })
    } else {
      /*
       * Mirrors canView()'s formula, which is the site's existing per-object
       * rule and is RICHER than "public or mine": it also honours Grants and
       * Packs. A list that ignored those would hide content a person has been
       * given legitimate access to -- the opposite failure from the one this
       * fragment exists to fix, and just as wrong.
       */
      const or: Record<string, unknown>[] = [
        { isPublic: true },
        { [ownerField]: viewerId },
      ]

      if (fields.grantSubject) {
        const granted = await grantedSubjectIds(viewerId, fields.grantSubject)
        if (granted.length) or.push({ id: { in: granted } })
      }

      if (fields.packGated) {
        const packs = await viewablePackIds(viewerId)
        if (packs.length) or.push({ packId: { in: packs } })
      }

      clauses.push({ OR: or })
    }
  }

  /*
   * Applied to an ADMIN too. Being an admin is not being an adult: a CHILD who
   * is also an ADMIN is still maturity-restricted, which is why viewerShowsMature
   * reads the role rather than the privilege.
   *
   * This used to ask only viewerShowsMature -- the CHILD barrier -- so an
   * adult with the toggle OFF still received mature rows from the API, and only
   * the front end hid them. Thirty-nine components were doing that hiding and
   * seven endpoints were not; the gate belongs here instead.
   */
  if (fields.isMature && !viewerShowsMature(user, showMature)) {
    /*
     * YOUR OWN MATURE ROWS ARRIVE; THEY ARE COVERED, NOT ABSENT.
     *
     * Silas, 2026-09-18: "in the case of mature objects I own, it's better to
     * carve them out on the listing, it's more likely that I want them hidden
     * for situational propriety, not gone for good." The toggle is a curtain
     * over your own work, not a delete -- the row is delivered with its flag
     * and the card covers it, with an uncover the owner can use.
     *
     * Other people's mature content stays absent: there is nothing to uncover
     * and no reason to ship it.
     *
     * The carve-out is the PREFERENCE only. isMaturityRestricted keeps the hard
     * barrier even on a CHILD's own rows -- a child should not have mature
     * content, and hiding it is the protective direction.
     */
    const ownRowsExempt =
      viewerId !== null && !isMaturityRestricted(user)
        ? { OR: [{ isMature: false }, { [ownerField]: viewerId }] }
        : { isMature: false }

    clauses.push(ownRowsExempt)
  }

  if (!clauses.length) return {}
  if (clauses.length === 1) return clauses[0] as Record<string, unknown>
  return { AND: clauses }
}

/**
 * canView(), plus the maturity rule. The per-object twin of visibilityWhere().
 * Maturity is viewerShowsMature(): logged in, not a CHILD, and opted in.
 *
 * canView() answers privacy richly -- owner, admin, Grant, Pack -- and says
 * nothing about maturity, because it predates that rule being stated for the
 * whole site. A single-object read needs both: `/api/dreams/12` handing a
 * mature Dream to a CHILD is the same failure as a listing doing it, and the
 * id is trivially guessable.
 *
 * Maturity is checked after access, and applies to an admin too: a CHILD who
 * also holds ADMIN is still a child.
 */
export async function canViewWithMaturity(
  subject: AccessSubject & { isMature?: boolean | null },
  subjectType: GrantSubject | null,
  user: (AccessUser & MaturityUser) | null | undefined,
  /** The per-request `?showMature=` parameter. May only narrow. */
  showMature?: boolean,
): Promise<boolean> {
  if (!(await canView(subject, subjectType, user))) return false
  if (subject.isMature && !viewerShowsMature(user, showMature)) return false
  return true
}
