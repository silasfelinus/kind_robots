// /server/utils/authGuard.ts
import { createError, getHeader, type H3Event } from 'h3'
import prisma from './prisma'
import { verifyJwtToken } from '@/server/api/auth'
import { type AuthUser, withAdminFlag } from './authUser'

export type AuthGuardResult = {
  user: AuthUser
  kind: 'jwt' | 'beta-admin-token'
  isAdmin: boolean
}

const config = useRuntimeConfig()

function readBearerToken(event: H3Event): string {
  const authorization = getHeader(event, 'authorization') ?? ''

  return authorization
    .trim()
    .replace(/^Bearer\s+/i, '')
    .trim()
}

function readBetaAdminToken(event: H3Event): string {
  return (
    getHeader(event, 'x-beta-admin-token') ||
    getHeader(event, 'x-admin-token') ||
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

async function getUserById(id: number): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  })

  return user ? withAdminFlag(user) : null
}

async function validateJwtAuth(token: string): Promise<AuthGuardResult | null> {
  if (!token) return null

  const verification = await verifyJwtToken(token)

  if (!verification.success || !verification.userId) return null

  const user = await getUserById(verification.userId)

  if (!user || !user.isActive) return null

  return {
    user,
    kind: 'jwt',
    isAdmin: user.isAdmin,
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
  }
}

export async function getOptionalApiUser(
  event: H3Event,
): Promise<AuthGuardResult | null> {
  const token = readBearerToken(event)

  return (await validateJwtAuth(token)) ?? (await validateBetaAdminAuth(event))
}

export async function requireApiUser(event: H3Event): Promise<AuthGuardResult> {
  const auth = await getOptionalApiUser(event)

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired authorization token.',
    })
  }

  return auth
}
