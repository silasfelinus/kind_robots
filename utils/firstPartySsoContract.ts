import crypto from 'node:crypto'

export type FirstPartyClient = {
  id: string
  label: string
  redirectUris: string[]
}

export type AuthorizationCodeRecord = {
  id: bigint | number
  codeHash: string
  userId: number
  clientId: string
  redirectUri: string
  codeChallenge: string
  codeChallengeMethod: string
  expiresAt: Date
  consumedAt: Date | null
}

export const DEFAULT_FIRST_PARTY_CLIENTS: readonly FirstPartyClient[] = [
  {
    id: 'rainbow-butterflies',
    label: 'Rainbow Butterflies',
    redirectUris: [
      'https://rainbowbutterflies.org/auth/callback',
      'https://rainbowbutterflies.org/auth/google/callback',
      'http://localhost:3000/auth/callback',
      'http://localhost:3000/auth/google/callback',
      'http://127.0.0.1:3000/auth/callback',
      'http://127.0.0.1:3000/auth/google/callback',
    ],
  },
]

const CLIENT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeRedirectUri(value: unknown): string | null {
  const raw = cleanString(value)
  if (!raw || raw.length > 1024) return null

  try {
    const url = new URL(raw)
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (url.username || url.password || url.hash) return null
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) return null
    return url.toString()
  } catch {
    return null
  }
}

function normalizeClient(value: unknown): FirstPartyClient | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  const id = cleanString(row.id).toLowerCase()
  const label = cleanString(row.label)
  if (!CLIENT_ID_PATTERN.test(id) || !label || !Array.isArray(row.redirectUris)) return null

  const redirectUris = Array.from(
    new Set(
      row.redirectUris
        .map(normalizeRedirectUri)
        .filter((uri): uri is string => Boolean(uri)),
    ),
  )
  if (!redirectUris.length) return null

  return { id, label, redirectUris }
}

export function parseFirstPartyClients(input: unknown): FirstPartyClient[] {
  if (!Array.isArray(input)) return DEFAULT_FIRST_PARTY_CLIENTS.map(cloneClient)

  const clients: FirstPartyClient[] = []
  const seen = new Set<string>()
  for (const value of input) {
    const client = normalizeClient(value)
    if (!client || seen.has(client.id)) continue
    seen.add(client.id)
    clients.push(client)
  }

  return clients.length ? clients : DEFAULT_FIRST_PARTY_CLIENTS.map(cloneClient)
}

export function parseFirstPartyClientsJson(raw: string | undefined): FirstPartyClient[] {
  const text = cleanString(raw)
  if (!text) return DEFAULT_FIRST_PARTY_CLIENTS.map(cloneClient)

  try {
    return parseFirstPartyClients(JSON.parse(text))
  } catch {
    return DEFAULT_FIRST_PARTY_CLIENTS.map(cloneClient)
  }
}

function cloneClient(client: FirstPartyClient): FirstPartyClient {
  return { ...client, redirectUris: [...client.redirectUris] }
}

export function findFirstPartyClient(
  clients: readonly FirstPartyClient[],
  clientId: unknown,
): FirstPartyClient | null {
  const id = cleanString(clientId).toLowerCase()
  return clients.find((client) => client.id === id) ?? null
}

export function isAllowedFirstPartyRedirect(
  client: FirstPartyClient,
  redirectUri: unknown,
): boolean {
  const normalized = normalizeRedirectUri(redirectUri)
  return Boolean(normalized && client.redirectUris.includes(normalized))
}

export function normalizeAllowedFirstPartyRedirect(
  client: FirstPartyClient,
  redirectUri: unknown,
): string | null {
  const normalized = normalizeRedirectUri(redirectUri)
  return normalized && client.redirectUris.includes(normalized) ? normalized : null
}

export function validateSsoState(value: unknown): string | null {
  const state = cleanString(value)
  return state.length >= 16 && state.length <= 512 ? state : null
}

export function validatePkceChallenge(value: unknown): string | null {
  const challenge = cleanString(value)
  if (challenge.length < 43 || challenge.length > 128) return null
  return BASE64URL_PATTERN.test(challenge) ? challenge : null
}

export function validatePkceVerifier(value: unknown): string | null {
  const verifier = cleanString(value)
  if (verifier.length < 43 || verifier.length > 128) return null
  return BASE64URL_PATTERN.test(verifier) ? verifier : null
}

export function pkceS256(verifier: string): string {
  return crypto.createHash('sha256').update(verifier, 'ascii').digest('base64url')
}

export function verifyPkceS256(verifier: string, challenge: string): boolean {
  const derived = Buffer.from(pkceS256(verifier), 'utf8')
  const expected = Buffer.from(challenge, 'utf8')
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected)
}

export function hashAuthorizationCode(code: string): string {
  return crypto.createHash('sha256').update(code, 'utf8').digest('hex')
}

export function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString('base64url')
}

export type AuthorizationCodeExchangeInput = {
  clientId: string
  redirectUri: string
  verifier: string
  now?: Date
}

export type AuthorizationCodeExchangeDecision =
  | { ok: true; userId: number }
  | { ok: false; reason: 'consumed' | 'expired' | 'client' | 'redirect' | 'pkce' }

export function evaluateAuthorizationCodeExchange(
  record: AuthorizationCodeRecord,
  input: AuthorizationCodeExchangeInput,
): AuthorizationCodeExchangeDecision {
  if (record.consumedAt) return { ok: false, reason: 'consumed' }
  const now = input.now ?? new Date()
  if (record.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: 'expired' }
  if (record.clientId !== input.clientId) return { ok: false, reason: 'client' }
  if (record.redirectUri !== input.redirectUri) return { ok: false, reason: 'redirect' }
  if (record.codeChallengeMethod !== 'S256') return { ok: false, reason: 'pkce' }
  if (!verifyPkceS256(input.verifier, record.codeChallenge)) {
    return { ok: false, reason: 'pkce' }
  }

  return { ok: true, userId: record.userId }
}

export const FIRST_PARTY_EXCHANGE_FIELDS = new Set([
  'grant_type',
  'client_id',
  'redirect_uri',
  'code',
  'code_verifier',
])
