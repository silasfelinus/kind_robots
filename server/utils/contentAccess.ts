// /server/utils/contentAccess.ts
// Shared access-check helpers for the Grant model (SHARING-SPEC.md,
// pitches/2026-07-17-sharing-grant-model.md, kind-robots/t-044). Extended in
// kind-robots/t-050 (pitches/2026-07-18-pack-model-dlc-unlocks.md) to also
// cover Pack-gated content (Dream, Facet, Character, Reward's nullable
// packId) via GrantSubject.PACK.
import prisma from './prisma'
import { GrantLevel, type GrantSubject } from '~/prisma/generated/prisma/client'
import { userIsAdmin } from './authUser'

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

type MaturityUser = {
  id?: number | null
  Role?: string | null
  role?: string | null
  roles?: readonly string[] | null
  UserRoles?: readonly { role: string }[] | null
  showMature?: boolean | null
}

export function effectiveShowMature(
  user: MaturityUser | null | undefined,
): boolean {
  if (isMaturityRestricted(user)) return false
  return user?.showMature === true
}

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

function qualifyingGrantLevels(minLevel: GrantLevel): GrantLevel[] {
  return (Object.keys(GRANT_LEVEL_RANK) as GrantLevel[]).filter(
    (level) => GRANT_LEVEL_RANK[level] >= GRANT_LEVEL_RANK[minLevel],
  )
}

function isAdminUser(user: AccessUser): boolean {
  return typeof user.isAdmin === 'boolean' ? user.isAdmin : userIsAdmin(user)
}

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
  const grants = await prisma.grant.findMany({
    where: {
      granteeId: userId,
      subjectType: 'PACK',
      status: 'ACTIVE',
      level: { in: qualifyingGrantLevels(GrantLevel.VIEW) },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { subjectId: true },
  })

  return Array.from(new Set(grants.map((grant) => grant.subjectId)))
}

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
