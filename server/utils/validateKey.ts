// /server/utils/validateKey.ts
import { getHeader, type H3Event } from 'h3'
import prisma from './prisma'
import { verifyJwtToken } from '@/server/api/auth'
import { userIsAdmin } from './authUser'

export type ValidateResult = {
  isValid: boolean
  user?: { id: number; Role: string }
  kind?: 'jwt' | 'beta-admin-token' | 'server'
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
    getHeader(event, 'authorization') ||
      getHeader(event, 'x-beta-admin-token') ||
      getHeader(event, 'x-admin-token'),
  )
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

async function getAuthUser(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, Role: true, isActive: true },
  })

  if (!user || !user.isActive) return null

  return user
}

async function validateJwtString(
  token: string,
): Promise<ValidateResult | null> {
  if (!token) return null

  const verification = await verifyJwtToken(token)

  if (!verification.success || !verification.userId) return null

  const user = await getAuthUser(verification.userId)

  if (!user) return null

  return {
    isValid: true,
    user: { id: user.id, Role: user.Role },
    kind: 'jwt',
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
    user: { id: user.id, Role: user.Role },
    kind: 'beta-admin-token',
  }
}

export async function validateApiKeyString(
  token?: string,
): Promise<ValidateResult> {
  const clean = cleanToken(token)

  return (
    (await validateJwtString(clean)) ??
    (await validateBetaAdminString(clean)) ?? {
      isValid: false,
    }
  )
}

export async function validateApiKey(event: H3Event): Promise<ValidateResult> {
  return validateApiKeyString(readRequestToken(event))
}
