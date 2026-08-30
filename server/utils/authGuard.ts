// /server/utils/authGuard.ts
import { createError, getHeader, type H3Event } from 'h3'
import prisma from './prisma'
import { verifyJwtToken } from '@/server/api/auth'
import { type AuthUser, withAdminFlag } from './authUser'
import {
  validateAgentCredential,
  type AgentCredentialScope,
} from './agentCredentials'

export type AuthGuardResult = {
  user: AuthUser
  kind: 'jwt' | 'beta-admin-token' | 'user-api-key' | 'agent-credential'
  isAdmin: boolean
  isServerKey: boolean
  /** Only set for kind: 'agent-credential' -- the scopes that credential was granted. */
  scopes?: AgentCredentialScope[]
  /** Only set for kind: 'agent-credential' -- the AgentCredential row's id. */
  credentialId?: number
  /** Only set for kind: 'agent-credential' when the credential names a Bot. */
  botId?: number | null
}

const config = useRuntimeConfig()

function readBearerToken(event: H3Event): string {
  const authorization = getHeader(event, 'authorization') ?? ''

  return authorization
    .trim()
    .replace(/^Bearer\s+/i, '')
    .trim()
}

function readUserApiKey(event: H3Event): string {
  return (getHeader(event, 'x-api-key') || readBearerToken(event)).trim()
}

function readBetaAdminToken(event: H3Event): string {
  return (
    getHeader(event, 'x-beta-admin-token') ||
    getHeader(event, 'x-admin-token') ||
    getHeader(event, 'x-api-key') ||
    readBearerToken(event)
  ).trim()
}

function getConfiguredBetaAdminToken(): string {
  return String(
    config.betaAdminToken ||
      config.adminToken ||
      process.env.BETA_ADMIN_TOKEN ||
      process.env.ADMIN_TOKEN ||
      '',
  ).trim()
}

function getBetaAdminUserId(): number {
  const raw = Number(
    config.betaAdminUserId || process.env.BETA_ADMIN_USER_ID || 1,
  )

  return Number.isInteger(raw) && raw > 0 ? raw : 1
}

// Every user-resolving path here loads the UserRole join table alongside the
// user, so `AuthUser.roles` is the complete set and downstream guards never
// have to issue a second query to answer "is this user an admin". The include
// is the reason `userIsAdmin` can stay synchronous and no call site signature
// had to change when roles went plural.
const WITH_ROLES = { UserRoles: { select: { role: true } } } as const

async function getUserById(id: number): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: WITH_ROLES,
  })

  return user ? withAdminFlag(user, user.UserRoles) : null
}

async function validateJwtAuth(token: string): Promise<AuthGuardResult | null> {
  if (!token) return null

  if (token.split('.').length !== 3) return null

  let verification: Awaited<ReturnType<typeof verifyJwtToken>>
  try {
    verification = await verifyJwtToken(token)
  } catch {
    return null
  }

  if (!verification.success || !verification.userId) return null

  const user = await getUserById(verification.userId)

  if (!user || !user.isActive) return null

  return {
    user,
    kind: 'jwt',
    isAdmin: user.isAdmin,
    isServerKey: false,
  }
}

async function validateBetaAdminAuth(
  event: H3Event,
): Promise<AuthGuardResult | null> {
  const configuredToken = getConfiguredBetaAdminToken()
  const suppliedToken = readBetaAdminToken(event)

  if (!configuredToken || !suppliedToken || suppliedToken !== configuredToken)
    return null

  const user = await getUserById(getBetaAdminUserId())

  if (!user || !user.isActive || !user.isAdmin) return null

  return {
    user,
    kind: 'beta-admin-token',
    isAdmin: true,
    isServerKey: true,
  }
}

async function validateUserApiKeyAuth(
  token: string,
): Promise<AuthGuardResult | null> {
  if (!token) return null

  const user = await prisma.user.findFirst({
    where: { apiKey: token },
    include: WITH_ROLES,
  })

  if (!user || user.isActive === false) return null

  const authUser = withAdminFlag(user, user.UserRoles)

  return {
    user: authUser,
    kind: 'user-api-key',
    isAdmin: authUser.isAdmin,
    isServerKey: false,
  }
}

// rainbow-butterflies/t-015: the scoped-credential replacement for
// validateUserApiKeyAuth above. Deliberately does NOT inherit the owning
// user's isAdmin flag -- an agent credential is meant to carry only the
// narrow scopes it was issued, never blanket admin access, even when its
// owner is an admin. Callers that need admin-gated behavior for a human
// admin must still authenticate as that admin directly (jwt/beta-admin-token/
// user-api-key), not through an agent credential.
async function validateAgentCredentialAuth(
  token: string,
): Promise<AuthGuardResult | null> {
  if (!token || !token.includes('.')) return null

  const result = await validateAgentCredential(token)
  if (!result) return null

  const user = await getUserById(result.userId)
  if (!user || !user.isActive) return null

  return {
    user,
    kind: 'agent-credential',
    isAdmin: false,
    isServerKey: false,
    scopes: result.scopes,
    credentialId: result.credentialId,
    botId: result.botId,
  }
}

export async function getOptionalApiUser(
  event: H3Event,
): Promise<AuthGuardResult | null> {
  const bearerToken = readBearerToken(event)
  const userApiKey = readUserApiKey(event)

  return (
    (await validateJwtAuth(bearerToken)) ??
    (await validateAgentCredentialAuth(userApiKey)) ??
    (await validateUserApiKeyAuth(userApiKey)) ??
    (await validateBetaAdminAuth(event))
  )
}

export async function requireMachineUser(
  event: H3Event,
): Promise<AuthGuardResult> {
  const auth = await getOptionalApiUser(event)

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token.',
    })
  }

  return auth
}

export async function requireApiUser(event: H3Event): Promise<AuthGuardResult> {
  const auth = await getOptionalApiUser(event)

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token.',
    })
  }

  return auth
}

export async function requireAdminApiUser(
  event: H3Event,
): Promise<AuthGuardResult> {
  const auth = await requireApiUser(event)

  if (!auth.isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Admin access required.',
    })
  }

  return auth
}

/**
 * True if `auth` is allowed to perform `scope`-gated work. Non-agent-credential
 * auth (jwt/user-api-key/beta-admin-token) acts as the full authenticated user
 * and is never scope-restricted; only `kind: 'agent-credential'` is limited to
 * its own granted scopes.
 */
export function authHasScope(
  auth: AuthGuardResult,
  scope: AgentCredentialScope,
): boolean {
  if (auth.kind !== 'agent-credential') return true

  return (auth.scopes ?? []).includes(scope)
}

/**
 * Same as requireApiUser, but 403s if the resolved auth is itself an agent
 * credential. Use this for endpoints that manage credentials (create/list/
 * revoke) so a scoped agent credential can never mint, enumerate, or revoke
 * credentials on its own behalf -- that management surface stays reachable
 * only by the real, fully-authenticated user (jwt/user-api-key/beta-admin-token).
 */
export async function requireHumanApiUser(
  event: H3Event,
): Promise<AuthGuardResult> {
  const auth = await requireApiUser(event)

  if (auth.kind === 'agent-credential') {
    throw createError({
      statusCode: 403,
      message: 'Agent credentials cannot manage credentials.',
    })
  }

  return auth
}

/** Same as requireApiUser, but 403s unless the resolved auth carries `scope`. */
export async function requireScopedApiUser(
  event: H3Event,
  scope: AgentCredentialScope,
): Promise<AuthGuardResult> {
  const auth = await requireApiUser(event)

  if (!authHasScope(auth, scope)) {
    throw createError({
      statusCode: 403,
      message: `This credential is not authorized for scope "${scope}".`,
    })
  }

  return auth
}
