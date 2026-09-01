// /server/utils/authGuard.ts
import { createError, getHeader, type H3Event } from 'h3'
import prisma from './prisma'
import { verifyJwtToken } from '@/server/api/auth'
import { type AuthUser, withAdminFlag } from './authUser'
import {
  validateAgentCredential,
  type AgentCredentialScope,
} from './agentCredentials'
import { validateFirstPartyDelegation } from './firstPartyDelegation'

export type AuthGuardResult = {
  user: AuthUser
  kind:
    | 'jwt'
    | 'beta-admin-token'
    | 'user-api-key'
    | 'agent-credential'
    | 'first-party-delegation'
  isAdmin: boolean
  isServerKey: boolean
  scopes?: AgentCredentialScope[]
  credentialId?: number
  botId?: number | null
  agentProfileId?: number | null
  /** First-party client that owns this BFF delegation. */
  clientId?: string
}

const config = useRuntimeConfig()

function readBearerToken(event: H3Event): string {
  const authorization = getHeader(event, 'authorization') ?? ''
  return authorization.trim().replace(/^Bearer\s+/i, '').trim()
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
  const raw = Number(config.betaAdminUserId || process.env.BETA_ADMIN_USER_ID || 1)
  return Number.isInteger(raw) && raw > 0 ? raw : 1
}

const WITH_ROLES = { UserRoles: { select: { role: true } } } as const

async function getUserById(id: number): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: WITH_ROLES,
  })
  return user ? withAdminFlag(user, user.UserRoles) : null
}

async function validateJwtAuth(token: string): Promise<AuthGuardResult | null> {
  if (!token || token.split('.').length !== 3) return null

  let verification: Awaited<ReturnType<typeof verifyJwtToken>>
  try {
    verification = await verifyJwtToken(token)
  } catch {
    return null
  }

  // First-party delegation JWTs deliberately have no `id` claim, so they do
  // not fall through this normal long-lived Kind Robots JWT path.
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

async function validateFirstPartyDelegationAuth(
  token: string,
): Promise<AuthGuardResult | null> {
  const delegation = await validateFirstPartyDelegation(token)
  if (!delegation) return null

  const user = await getUserById(delegation.userId)
  if (!user || !user.isActive) return null

  // A first-party product surface acts as the human for ordinary user-owned
  // APIs, but it never inherits Kind Robots administrator privilege.
  return {
    user,
    kind: 'first-party-delegation',
    isAdmin: false,
    isServerKey: false,
    clientId: delegation.clientId,
  }
}

async function validateBetaAdminAuth(event: H3Event): Promise<AuthGuardResult | null> {
  const configuredToken = getConfiguredBetaAdminToken()
  const suppliedToken = readBetaAdminToken(event)
  if (!configuredToken || !suppliedToken || suppliedToken !== configuredToken) return null

  const user = await getUserById(getBetaAdminUserId())
  if (!user || !user.isActive || !user.isAdmin) return null

  return {
    user,
    kind: 'beta-admin-token',
    isAdmin: true,
    isServerKey: true,
  }
}

async function validateUserApiKeyAuth(token: string): Promise<AuthGuardResult | null> {
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
    agentProfileId: result.agentProfileId,
  }
}

export async function getOptionalApiUser(event: H3Event): Promise<AuthGuardResult | null> {
  const bearerToken = readBearerToken(event)
  const userApiKey = readUserApiKey(event)

  return (
    (await validateJwtAuth(bearerToken)) ??
    (await validateFirstPartyDelegationAuth(bearerToken)) ??
    (await validateAgentCredentialAuth(userApiKey)) ??
    (await validateUserApiKeyAuth(userApiKey)) ??
    (await validateBetaAdminAuth(event))
  )
}

export async function requireMachineUser(event: H3Event): Promise<AuthGuardResult> {
  const auth = await getOptionalApiUser(event)
  if (!auth) throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
  return auth
}

export async function requireApiUser(event: H3Event): Promise<AuthGuardResult> {
  const auth = await getOptionalApiUser(event)
  if (!auth) throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
  return auth
}

export async function requireAdminApiUser(event: H3Event): Promise<AuthGuardResult> {
  const auth = await requireApiUser(event)
  if (!auth.isAdmin) throw createError({ statusCode: 403, message: 'Admin access required.' })
  return auth
}

export function authHasScope(
  auth: AuthGuardResult,
  scope: AgentCredentialScope,
): boolean {
  if (auth.kind !== 'agent-credential') return true
  return (auth.scopes ?? []).includes(scope)
}

export async function requireHumanApiUser(event: H3Event): Promise<AuthGuardResult> {
  const auth = await requireApiUser(event)

  if (auth.kind === 'agent-credential') {
    throw createError({
      statusCode: 403,
      message: 'Agent credentials cannot manage credentials.',
    })
  }

  return auth
}

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
