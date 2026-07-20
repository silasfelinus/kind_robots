// /server/utils/appmakerGithub.ts
// Shared helpers for the AppMaker GitHub App integration (appmaker/t-008,
// GITHUB-APP-DESIGN.md). Nothing here stores a credential — the app private
// key and webhook secret stay in server runtime config only.
import crypto from 'node:crypto'
import { createError } from 'h3'
import { importPKCS8, jwtVerify, SignJWT } from 'jose'

// The GitHub App's slug, per GITHUB-APP-DESIGN.md §2. Not a secret — used to
// build the public installation URL.
export const APPMAKER_GITHUB_APP_SLUG = 'kind-robots-appmaker'

const STATE_PURPOSE = 'appmaker-github-connect'

function getJwtSecretKey() {
  const { jwtSecret } = useRuntimeConfig()
  if (!jwtSecret) {
    throw createError({
      statusCode: 500,
      message: 'JWT secret is not configured',
    })
  }
  return crypto.createSecretKey(Buffer.from(jwtSecret as string, 'utf-8'))
}

/**
 * Signs a short-lived, single-purpose state nonce binding a GitHub App
 * installation round-trip to the kind_robots user who started it
 * (GITHUB-APP-DESIGN.md §5a step 1). Reuses the app's existing JWT_SECRET
 * rather than provisioning a dedicated secret for this one flow.
 */
export async function signInstallState(userId: number): Promise<string> {
  return new SignJWT({ purpose: STATE_PURPOSE, userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(getJwtSecretKey())
}

/**
 * Verifies the state nonce GitHub redirects back with (§5a step 3). Throws a
 * 400 on any mismatch — expired, wrong purpose, or tampered.
 */
export async function verifyInstallState(state: string): Promise<number> {
  try {
    const { payload } = await jwtVerify(state, getJwtSecretKey())
    if (
      payload.purpose !== STATE_PURPOSE ||
      typeof payload.userId !== 'number'
    ) {
      throw new Error('unexpected state payload')
    }
    return payload.userId
  } catch {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired GitHub install state',
    })
  }
}

function getAppCredentials() {
  const { appmakerGhAppId, appmakerGhAppKey } = useRuntimeConfig()
  if (!appmakerGhAppId || !appmakerGhAppKey) {
    throw createError({
      statusCode: 500,
      message: 'AppMaker GitHub App is not configured',
    })
  }
  return {
    appId: appmakerGhAppId as string,
    privateKeyPem: (appmakerGhAppKey as string).replace(/\\n/g, '\n'),
  }
}

/**
 * Signs a GitHub App JWT (RS256, §3) used to authenticate as the app itself
 * for the installation-details lookup. iat is backdated 60s per GitHub's own
 * clock-drift guidance; exp is capped at GitHub's 10-minute max.
 */
export async function signAppJwt(): Promise<string> {
  const { appId, privateKeyPem } = getAppCredentials()
  const privateKey = await importPKCS8(privateKeyPem, 'RS256')
  const now = Math.floor(Date.now() / 1000)

  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 9 * 60)
    .setIssuer(appId)
    .sign(privateKey)
}

const GITHUB_API_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

export interface GithubInstallationDetails {
  installationId: number
  accountLogin: string
}

/**
 * Fetches installation details as the app itself (§5a step 3). Used only to
 * confirm the installation exists and to read the account it was granted on
 * — never to mint an installation access token (that's t-009's scope, when
 * AppMaker actually needs to act on a granted repo).
 */
export async function fetchInstallationDetails(
  installationId: number,
): Promise<GithubInstallationDetails> {
  const appJwt = await signAppJwt()

  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}`,
    {
      headers: { ...GITHUB_API_HEADERS, Authorization: `Bearer ${appJwt}` },
    },
  )

  if (!res.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub installation lookup failed (${res.status})`,
    })
  }

  const data = (await res.json()) as {
    id: number
    account?: { login?: string }
  }

  return {
    installationId: data.id,
    accountLogin: data.account?.login ?? 'unknown',
  }
}

/**
 * Verifies the `X-Hub-Signature-256` header against the raw webhook body
 * (§6 invariant 4 — unverified payloads are dropped, not processed). Mirrors
 * server/api/stripe/webhook.post.ts's raw-body pattern; HMAC-SHA256 is
 * hand-rolled since there's no GitHub SDK dependency in this repo.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  webhookSecret: string,
): boolean {
  if (!signatureHeader?.startsWith('sha256=')) return false

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')
  const expectedHeader = `sha256=${expected}`

  const a = Buffer.from(signatureHeader)
  const b = Buffer.from(expectedHeader)
  if (a.length !== b.length) return false

  return crypto.timingSafeEqual(a, b)
}
