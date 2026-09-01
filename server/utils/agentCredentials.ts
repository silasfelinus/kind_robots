// /server/utils/agentCredentials.ts
// rainbow-butterflies/t-015: first-class scoped per-agent credentials,
// replacing the legacy whole-user User.apiKey (server/utils/authGuard.ts's
// 'user-api-key' path) for machine/agent callers. A credential is shown to
// its creator exactly once at creation time; only a bcrypt hash of the
// secret half is ever persisted (never reversible -- see
// server/utils/secretCrypto.ts for the repo's *reversible*-encryption tool,
// which is deliberately NOT used here).
import { randomBytes } from 'node:crypto'
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs'
import prisma from './prisma'
import type { AgentCredential } from '~/prisma/generated/prisma/client'
import {
  DEFAULT_FORUM_AGENT_SCOPES,
  sanitizeScopes,
  type AgentCredentialScope,
} from '~/utils/agentCredentialScopes'

// Re-exported so existing call sites/imports of this module keep working --
// the actual scope vocabulary now lives in utils/agentCredentialScopes.ts
// (shared with the client; see that file's own note on why the split
// exists) rather than being defined here twice.
export {
  AGENT_CREDENTIAL_SCOPES,
  DEFAULT_FORUM_AGENT_SCOPES,
  isValidScope,
  sanitizeScopes,
  type AgentCredentialScope,
} from '~/utils/agentCredentialScopes'

const SALT_ROUNDS = 10
const PREFIX_BYTES = 6 // -> 12 hex chars, well under the column's 16-char cap
const SECRET_BYTES = 32

export type SafeAgentCredential = Omit<
  AgentCredential,
  'hashedSecret' | 'scopes'
> & {
  scopes: AgentCredentialScope[]
  /** Durable external-agent identity, separate from optional legacy Bot binding. */
  agentProfileId: number | null
}

export function toSafeCredential(
  row: AgentCredential,
  agentProfileId: number | null = null,
): SafeAgentCredential {
  const { hashedSecret: _hashedSecret, scopes, ...rest } = row
  void _hashedSecret

  return { ...rest, scopes: sanitizeScopes(scopes), agentProfileId }
}

export type CreateAgentCredentialInput = {
  userId: number
  botId?: number | null
  agentProfileId?: number | null
  label: string
  scopes?: AgentCredentialScope[]
  expiresAt?: Date | null
}

export type CreateAgentCredentialResult = {
  credential: SafeAgentCredential
  /** The full bearer token -- `<keyPrefix>.<secret>`. Shown once; never persisted. */
  token: string
}

/**
 * Issue a new credential for a user. Legacy callers may bind it to one Bot;
 * Rainbow's v2 path binds it to one durable AgentProfile instead. A credential
 * cannot represent both identities at once. Returns the plaintext token exactly
 * once -- it cannot be recovered later, only rotated.
 */
export async function createAgentCredential(
  input: CreateAgentCredentialInput,
): Promise<CreateAgentCredentialResult> {
  const label = input.label.trim()
  if (!label) {
    throw new Error('label is required')
  }

  const botId = input.botId ?? null
  const agentProfileId = input.agentProfileId ?? null
  if (botId && agentProfileId) {
    throw new Error('a credential cannot bind both botId and agentProfileId')
  }

  if (agentProfileId) {
    const profile = await prisma.agentProfile.findUnique({
      where: { id: agentProfileId },
      select: { userId: true, isActive: true },
    })
    if (!profile || profile.userId !== input.userId || !profile.isActive) {
      throw new Error('agentProfileId must reference an active profile you own')
    }
  }

  const scopes =
    input.scopes && input.scopes.length > 0
      ? sanitizeScopes(input.scopes)
      : [...DEFAULT_FORUM_AGENT_SCOPES]

  if (scopes.length === 0) {
    throw new Error('at least one valid scope is required')
  }

  const keyPrefix = randomBytes(PREFIX_BYTES).toString('hex')
  const secret = randomBytes(SECRET_BYTES).toString('hex')
  const hashedSecret = await bcryptHash(secret, SALT_ROUNDS)

  const row = await prisma.$transaction(async (tx) => {
    const credential = await tx.agentCredential.create({
      data: {
        userId: input.userId,
        botId,
        label,
        keyPrefix,
        hashedSecret,
        scopes,
        expiresAt: input.expiresAt ?? null,
      },
    })

    if (agentProfileId) {
      await tx.agentProfileCredential.create({
        data: {
          agentProfileId,
          credentialId: credential.id,
        },
      })
    }

    return credential
  })

  return {
    credential: toSafeCredential(row, agentProfileId),
    token: `${keyPrefix}.${secret}`,
  }
}

export async function listAgentCredentials(
  userId: number,
): Promise<SafeAgentCredential[]> {
  const rows = await prisma.agentCredential.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  if (rows.length === 0) return []

  const links = await prisma.agentProfileCredential.findMany({
    where: { credentialId: { in: rows.map((row) => row.id) } },
    select: { credentialId: true, agentProfileId: true },
  })
  const profileByCredential = new Map(
    links.map((link) => [link.credentialId, link.agentProfileId]),
  )

  return rows.map((row) =>
    toSafeCredential(row, profileByCredential.get(row.id) ?? null),
  )
}

export type RevokeResult = 'revoked' | 'not-found' | 'forbidden'

/** Revoke a credential. Idempotent -- revoking an already-revoked row still succeeds. */
export async function revokeAgentCredential(
  id: number,
  userId: number,
): Promise<RevokeResult> {
  const row = await prisma.agentCredential.findUnique({ where: { id } })

  if (!row) return 'not-found'
  if (row.userId !== userId) return 'forbidden'

  if (!row.revokedAt) {
    await prisma.agentCredential.update({
      where: { id },
      data: { revokedAt: new Date() },
    })
  }

  return 'revoked'
}

export type ValidateAgentCredentialResult = {
  credentialId: number
  userId: number
  botId: number | null
  agentProfileId: number | null
  scopes: AgentCredentialScope[]
}

export type ParsedCredentialToken = { keyPrefix: string; secret: string }

/**
 * Split a bearer token of the form `<keyPrefix>.<secret>` into its two
 * halves. Pure and side-effect-free so it can be unit-tested without a
 * database -- see utils/scripts/verifyAgentCredentials.test.ts. Returns null
 * for anything that isn't exactly `<non-empty>.<non-empty>` (in particular,
 * a JWT's two dots or a bare legacy apiKey's zero dots never match).
 */
export function parseCredentialToken(
  token: string,
): ParsedCredentialToken | null {
  const trimmed = String(token || '').trim()
  const separatorIndex = trimmed.indexOf('.')
  if (separatorIndex <= 0 || separatorIndex === trimmed.length - 1) return null
  if (trimmed.indexOf('.', separatorIndex + 1) !== -1) return null

  return {
    keyPrefix: trimmed.slice(0, separatorIndex),
    secret: trimmed.slice(separatorIndex + 1),
  }
}

/**
 * Resolve a bearer token of the form `<keyPrefix>.<secret>` to the owning
 * user + optional Bot/AgentProfile identity + granted scopes. Returns null for
 * anything invalid, expired, or revoked.
 */
export async function validateAgentCredential(
  token: string,
): Promise<ValidateAgentCredentialResult | null> {
  const parsed = parseCredentialToken(token)
  if (!parsed) return null

  const { keyPrefix, secret } = parsed

  const row = await prisma.agentCredential.findUnique({ where: { keyPrefix } })
  if (!row) return null
  if (row.revokedAt) return null
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null

  const matches = await bcryptCompare(secret, row.hashedSecret)
  if (!matches) return null

  const [profileLink] = await Promise.all([
    prisma.agentProfileCredential.findUnique({
      where: { credentialId: row.id },
      select: { agentProfileId: true },
    }),
    prisma.agentCredential.update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    }),
  ])

  return {
    credentialId: row.id,
    userId: row.userId,
    botId: row.botId,
    agentProfileId: profileLink?.agentProfileId ?? null,
    scopes: sanitizeScopes(row.scopes),
  }
}
