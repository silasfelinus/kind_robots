// /server/utils/validateKey.ts
import { getHeader, type H3Event } from 'h3'
import prisma from './prisma'
import { verifyJwtToken } from '@/server/api/auth'
import { userIsAdmin } from './authUser'

export type ValidateResult = {
  isValid: boolean
  // `roles` is the complete set from the UserRole join table; `Role` remains
  // the primary/display role. Callers must ask through userIsAdmin/userHasRole
  // (server/utils/authUser.ts) rather than comparing `Role` directly -- an
  // admin whose primary role is CHILD or FAMILY only appears in `roles`.
  user?: { id: number; Role: string; roles: string[] }
  kind?: 'jwt' | 'user-api-key' | 'beta-admin-token' | 'server'
}

const config = useRuntimeConfig()

function cleanToken(value?: string | null): string {
  return (
    value
      ?.trim()
      .replace(/^Bearer\s+/i, '')
      .trim() || ''
  )
}

function readRequestToken(event: H3Event): string {
  return cleanToken(
    getHeader(event, 'x-api-key') ||
      getHeader(event, 'x-beta-admin-token') ||
      getHeader(event, 'x-admin-token') ||
      getHeader(event, 'authorization'),
  )
}

function getConfiguredBetaAdminToken(): string {
  return String(
    process.env.BETA_ADMIN_TOKEN ||
      process.env.ADMIN_TOKEN ||
      config.betaAdminToken ||
      config.adminToken ||
      '',
  ).trim()
}

function getBetaAdminUserId(): number {
  const raw = Number(
    process.env.BETA_ADMIN_USER_ID || config.betaAdminUserId || 1,
  )

  return Number.isInteger(raw) && raw > 0 ? raw : 1
}

// Mirrors authGuard.WITH_ROLES. This resolver uses explicit selects rather than
// full-row loads, so the join table has to be named here too -- omitting it
// would leave `roles` empty and quietly demote any user whose admin-ness lives
// only in the join table.
const ROLE_SELECT = {
  id: true,
  Role: true,
  isActive: true,
  UserRoles: { select: { role: true } },
} as const

function flattenRoles(user: {
  UserRoles?: { role: string }[] | null
}): string[] {
  return (user.UserRoles ?? []).map((entry) => String(entry.role))
}

async function getAuthUser(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: ROLE_SELECT,
  })

  if (!user || !user.isActive) return null

  return user
}

async function validateJwtString(
  token: string,
): Promise<ValidateResult | null> {
  if (!token || token.split('.').length !== 3) return null

  try {
    const verification = await verifyJwtToken(token)

    if (!verification.success || !verification.userId) return null

    const user = await getAuthUser(verification.userId)

    if (!user) return null

    return {
      isValid: true,
      user: { id: user.id, Role: user.Role, roles: flattenRoles(user) },
      kind: 'jwt',
    }
  } catch {
    return null
  }
}

async function validateUserApiKeyString(
  token: string,
): Promise<ValidateResult | null> {
  if (!token) return null

  const user = await prisma.user.findFirst({
    where: { apiKey: token },
    select: ROLE_SELECT,
  })

  if (!user || !user.isActive) return null

  return {
    isValid: true,
    user: { id: user.id, Role: user.Role, roles: flattenRoles(user) },
    kind: 'user-api-key',
  }
}

async function validateBetaAdminString(
  token: string,
): Promise<ValidateResult | null> {
  const configuredToken = getConfiguredBetaAdminToken()

  if (!configuredToken || !token || token !== configuredToken) return null

  const user = await getAuthUser(getBetaAdminUserId())

  if (!user || !userIsAdmin(user)) return null

  return {
    isValid: true,
    user: { id: user.id, Role: user.Role, roles: flattenRoles(user) },
    kind: 'beta-admin-token',
  }
}

export async function validateApiKeyString(
  token?: string,
): Promise<ValidateResult> {
  const clean = cleanToken(token)

  return (
    (await validateJwtString(clean)) ??
    (await validateUserApiKeyString(clean)) ??
    (await validateBetaAdminString(clean)) ?? {
      isValid: false,
    }
  )
}

export async function validateApiKey(event: H3Event): Promise<ValidateResult> {
  return validateApiKeyString(readRequestToken(event))
}
