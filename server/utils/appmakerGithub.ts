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
 * — signed with the app JWT, not an installation token (see
 * `mintInstallationToken` below for the latter, used when AppMaker actually
 * needs to act on a granted repo).
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

// --- appmaker/t-009: installation tokens + scaffold PR flow (§5b, §5d) -----

interface CachedToken {
  token: string
  expiresAtMs: number
}

// Per-invocation cache keyed by installation id (§3: "on serverless that
// degrades to per-invocation minting, which is acceptable"). A module-level
// Map still helps within one warm Lambda across requests, and the 60s safety
// margin keeps a token from being handed out right before GitHub expires it.
const tokenCache = new Map<number, CachedToken>()
const TOKEN_SAFETY_MARGIN_MS = 60_000

/**
 * Mints a short-lived installation access token (§3, §6 invariant 3). NEVER
 * return this value from an API response — it grants exactly the repos the
 * user chose to install the app on. Callers use it same-request, server-side
 * only, to call the GitHub REST/Git-Data API on the installation's behalf.
 */
async function mintInstallationToken(installationId: number): Promise<string> {
  const cached = tokenCache.get(installationId)
  if (cached && cached.expiresAtMs - TOKEN_SAFETY_MARGIN_MS > Date.now()) {
    return cached.token
  }

  const appJwt = await signAppJwt()
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: { ...GITHUB_API_HEADERS, Authorization: `Bearer ${appJwt}` },
    },
  )

  if (!res.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub installation-token mint failed (${res.status})`,
    })
  }

  const data = (await res.json()) as { token: string; expires_at: string }
  tokenCache.set(installationId, {
    token: data.token,
    expiresAtMs: new Date(data.expires_at).getTime(),
  })
  return data.token
}

function installationApiHeaders(token: string) {
  return { ...GITHUB_API_HEADERS, Authorization: `token ${token}` }
}

async function githubApi(
  path: string,
  token: string,
  init?: { method?: string; body?: unknown },
): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      ...installationApiHeaders(token),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  })
}

export interface GrantedRepo {
  owner: string
  repo: string
  defaultBranch: string
  private: boolean
}

/**
 * Lists the repos the installation was actually granted on GitHub (§5a step
 * 4) — distinct from `AppRepo`, which is only the subset we've already
 * mapped to a slug. Used by the create-app UI to offer repos the user can
 * pick a slug/name for.
 */
export async function listInstallationRepositories(
  installationId: number,
): Promise<GrantedRepo[]> {
  const token = await mintInstallationToken(installationId)
  const res = await githubApi('/installation/repositories?per_page=100', token)

  if (!res.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub granted-repo list failed (${res.status})`,
    })
  }

  const data = (await res.json()) as {
    repositories: Array<{
      name: string
      owner: { login: string }
      default_branch: string
      private: boolean
    }>
  }

  return data.repositories.map((repo) => ({
    owner: repo.owner.login,
    repo: repo.name,
    defaultBranch: repo.default_branch,
    private: repo.private,
  }))
}

export interface ScaffoldFile {
  path: string
  content: string
}

export interface ScaffoldPrResult {
  branch: string
  prUrl: string
  prNumber: number
}

/**
 * Worker role rules (§5d) enforced here: always a `worker/*` branch, always
 * a PR into the repo's default branch, never a merge — the installation
 * token could technically do more, but this helper is the only path AppMaker
 * code uses to write to an external repo, so it is the enforcement point.
 */
export async function pushScaffoldBranchAndOpenPr(params: {
  installationId: number
  owner: string
  repo: string
  slug: string
  files: ScaffoldFile[]
  prTitle: string
  prBody: string
}): Promise<ScaffoldPrResult> {
  const { installationId, owner, repo, slug, files, prTitle, prBody } = params
  const token = await mintInstallationToken(installationId)
  const branch = `worker/scaffold-${slug}`

  const repoRes = await githubApi(`/repos/${owner}/${repo}`, token)
  if (!repoRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub repo lookup failed (${repoRes.status})`,
    })
  }
  const repoData = (await repoRes.json()) as { default_branch: string }
  const baseBranch = repoData.default_branch

  const refRes = await githubApi(
    `/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
    token,
  )
  if (!refRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub base-branch lookup failed (${refRes.status})`,
    })
  }
  const refData = (await refRes.json()) as { object: { sha: string } }
  const baseSha = refData.object.sha

  const createRefRes = await githubApi(
    `/repos/${owner}/${repo}/git/refs`,
    token,
    {
      method: 'POST',
      body: { ref: `refs/heads/${branch}`, sha: baseSha },
    },
  )
  // 422 = ref already exists (a retry of a partially-completed scaffold) —
  // reuse it rather than fail; any other non-2xx is a real error.
  if (!createRefRes.ok && createRefRes.status !== 422) {
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub branch creation failed (${createRefRes.status})`,
    })
  }

  for (const file of files) {
    const putRes = await githubApi(
      `/repos/${owner}/${repo}/contents/${file.path}`,
      token,
      {
        method: 'PUT',
        body: {
          message: `AppMaker: scaffold ${file.path}`,
          content: Buffer.from(file.content, 'utf-8').toString('base64'),
          branch,
        },
      },
    )
    if (!putRes.ok) {
      throw createError({
        statusCode: 502,
        statusMessage: `GitHub file write failed for ${file.path} (${putRes.status})`,
      })
    }
  }

  const prRes = await githubApi(`/repos/${owner}/${repo}/pulls`, token, {
    method: 'POST',
    body: {
      title: prTitle,
      head: branch,
      base: baseBranch,
      body: prBody,
    },
  })
  if (!prRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub PR creation failed (${prRes.status})`,
    })
  }
  const prData = (await prRes.json()) as { html_url: string; number: number }

  return { branch, prUrl: prData.html_url, prNumber: prData.number }
}
