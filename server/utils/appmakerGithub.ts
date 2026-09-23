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

// --- appmaker/t-015: squash-graduation executor (§5c) -----------------------
//
// Reads the graduating app's tree out of THIS repo (conductor, via conductor's
// own GITHUB_TOKEN -- distinct from the installation token above, which only
// grants access to whatever repos the target installation was actually
// granted) and writes a single squash commit into the target repo via the
// installation token. Blobs are repo-scoped in the Git Data API, so a source
// blob sha cannot be referenced from the target repo's tree -- each file's
// content is re-read from conductor and re-posted as a new blob there.

const CONDUCTOR_REPO = 'silasfelinus/conductor'
const CONDUCTOR_DEFAULT_BRANCH = 'main'

function conductorReadToken(): string {
  const runtimeToken = useRuntimeConfig().githubToken
  return (
    process.env.GITHUB_TOKEN ||
    (typeof runtimeToken === 'string' ? runtimeToken : '')
  ).trim()
}

async function conductorApi(path: string, token: string): Promise<Response> {
  return fetch(`https://api.github.com/repos/${CONDUCTOR_REPO}${path}`, {
    headers: { ...GITHUB_API_HEADERS, Authorization: `Bearer ${token}` },
  })
}

export interface ConductorAppFile {
  /** Path relative to apps/<slug>/, e.g. "package.json" or "src/index.ts". */
  path: string
  sha: string
  mode: string
}

/**
 * Reads the full recursive tree under apps/<slug>/ at conductor's current
 * main tip via the Git Data API in one request, rather than walking
 * conductorList() one directory at a time -- a graduating app can be dozens
 * of files across nested directories.
 */
export async function readConductorAppTree(
  slug: string,
): Promise<{ headSha: string; files: ConductorAppFile[] }> {
  const token = conductorReadToken()
  if (!token) {
    throw createError({
      statusCode: 503,
      statusMessage:
        'Conductor GitHub read access is not configured (GITHUB_TOKEN).',
    })
  }

  const refRes = await conductorApi(
    `/git/ref/heads/${CONDUCTOR_DEFAULT_BRANCH}`,
    token,
  )
  if (!refRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Conductor main lookup failed (${refRes.status})`,
    })
  }
  const refData = (await refRes.json()) as { object: { sha: string } }
  const headSha = refData.object.sha

  const treeRes = await conductorApi(`/git/trees/${headSha}?recursive=1`, token)
  if (!treeRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Conductor tree read failed (${treeRes.status})`,
    })
  }
  const treeData = (await treeRes.json()) as {
    tree: Array<{ path: string; type: string; sha: string; mode: string }>
    truncated?: boolean
  }
  if (treeData.truncated) {
    throw createError({
      statusCode: 502,
      statusMessage:
        'Conductor tree listing was truncated by GitHub -- this app is too ' +
        'large for a single recursive tree read; graduate it manually.',
    })
  }

  const prefix = `apps/${slug}/`
  const files = treeData.tree
    .filter((entry) => entry.type === 'blob' && entry.path.startsWith(prefix))
    .map((entry) => ({
      path: entry.path.slice(prefix.length),
      sha: entry.sha,
      mode: entry.mode,
    }))

  if (files.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `apps/${slug}/ has no files in the conductor tree at ${headSha}.`,
    })
  }

  return { headSha, files }
}

async function readConductorBlobBase64(
  sha: string,
  token: string,
): Promise<string> {
  const res = await conductorApi(`/git/blobs/${sha}`, token)
  if (!res.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Conductor blob read failed for ${sha} (${res.status})`,
    })
  }
  const data = (await res.json()) as { content?: string; encoding?: string }
  if (String(data.encoding || '').toLowerCase() !== 'base64') {
    throw createError({
      statusCode: 502,
      statusMessage: `Conductor blob ${sha} came back as "${data.encoding}" rather than base64.`,
    })
  }
  // Re-post the same base64 bytes rather than decoding/re-encoding through a
  // string, so binary files (images, etc.) survive the round trip unchanged.
  return String(data.content || '').replace(/\s/g, '')
}

export interface SquashPushResult {
  commitSha: string
  commitHtmlUrl: string
  branch: string
  createdInitialCommit: boolean
}

/**
 * Writes every file from readConductorAppTree() into a single new commit on
 * the target repo's default branch, via the installation token. Handles both
 * a target repo that already has commits (fast-forwards the branch) and a
 * genuinely empty one (no ref exists yet to fast-forward -- the Git Data API
 * lets a commit with no parent and no base_tree be created directly, then the
 * ref for the default branch created to point at it, which is exactly the
 * initial-commit case an empty repo needs).
 */
export async function squashPushAppToRepo(params: {
  installationId: number
  owner: string
  repo: string
  files: ConductorAppFile[]
  commitMessage: string
}): Promise<SquashPushResult> {
  const { installationId, owner, repo, files, commitMessage } = params
  const token = await mintInstallationToken(installationId)
  const readToken = conductorReadToken()

  const repoRes = await githubApi(`/repos/${owner}/${repo}`, token)
  if (!repoRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Target repo lookup failed (${repoRes.status})`,
    })
  }
  const repoData = (await repoRes.json()) as { default_branch: string }
  const defaultBranch = repoData.default_branch || 'main'

  const refRes = await githubApi(
    `/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`,
    token,
  )
  const repoIsEmpty = refRes.status === 404
  if (!refRes.ok && !repoIsEmpty) {
    throw createError({
      statusCode: 502,
      statusMessage: `Target branch lookup failed (${refRes.status})`,
    })
  }

  let parentSha: string | undefined
  let baseTreeSha: string | undefined
  if (!repoIsEmpty) {
    const refData = (await refRes.json()) as { object: { sha: string } }
    parentSha = refData.object.sha
    const parentCommitRes = await githubApi(
      `/repos/${owner}/${repo}/git/commits/${parentSha}`,
      token,
    )
    if (!parentCommitRes.ok) {
      throw createError({
        statusCode: 502,
        statusMessage: `Target parent-commit lookup failed (${parentCommitRes.status})`,
      })
    }
    const parentCommitData = (await parentCommitRes.json()) as {
      tree: { sha: string }
    }
    baseTreeSha = parentCommitData.tree.sha
  }

  const treeEntries: Array<{
    path: string
    mode: string
    type: 'blob'
    sha: string
  }> = []
  for (const file of files) {
    const content = await readConductorBlobBase64(file.sha, readToken)
    const blobRes = await githubApi(
      `/repos/${owner}/${repo}/git/blobs`,
      token,
      {
        method: 'POST',
        body: { content, encoding: 'base64' },
      },
    )
    if (!blobRes.ok) {
      throw createError({
        statusCode: 502,
        statusMessage: `Target blob create failed for ${file.path} (${blobRes.status})`,
      })
    }
    const blobData = (await blobRes.json()) as { sha: string }
    treeEntries.push({
      path: file.path,
      mode: file.mode === '100755' ? '100755' : '100644',
      type: 'blob',
      sha: blobData.sha,
    })
  }

  const treeRes = await githubApi(`/repos/${owner}/${repo}/git/trees`, token, {
    method: 'POST',
    body: baseTreeSha
      ? { base_tree: baseTreeSha, tree: treeEntries }
      : { tree: treeEntries },
  })
  if (!treeRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Target tree create failed (${treeRes.status})`,
    })
  }
  const newTreeData = (await treeRes.json()) as { sha: string }

  const commitRes = await githubApi(
    `/repos/${owner}/${repo}/git/commits`,
    token,
    {
      method: 'POST',
      body: {
        message: commitMessage,
        tree: newTreeData.sha,
        ...(parentSha ? { parents: [parentSha] } : {}),
      },
    },
  )
  if (!commitRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Target commit create failed (${commitRes.status})`,
    })
  }
  const newCommit = (await commitRes.json()) as { sha: string }

  if (repoIsEmpty) {
    const createRefRes = await githubApi(
      `/repos/${owner}/${repo}/git/refs`,
      token,
      {
        method: 'POST',
        body: { ref: `refs/heads/${defaultBranch}`, sha: newCommit.sha },
      },
    )
    if (!createRefRes.ok) {
      throw createError({
        statusCode: 502,
        statusMessage: `Target ref create failed (${createRefRes.status})`,
      })
    }
  } else {
    const updateRefRes = await githubApi(
      `/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`,
      token,
      { method: 'PATCH', body: { sha: newCommit.sha, force: false } },
    )
    if (!updateRefRes.ok) {
      throw createError({
        statusCode: 502,
        statusMessage:
          `Target branch moved since it was read (non-fast-forward push ` +
          `refused, ${updateRefRes.status}) -- re-run against its current tip.`,
      })
    }
  }

  return {
    commitSha: newCommit.sha,
    commitHtmlUrl: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
    branch: defaultBranch,
    createdInitialCommit: repoIsEmpty,
  }
}

export interface RemovalPrResult {
  branch: string
  prUrl: string
  prNumber: number
}

/**
 * Opens a PR against conductor's own main removing every file under
 * apps/<slug>/ in a single commit -- the monorepo-removal half of graduation
 * (§5c). Uses conductor's own token (this repo, not an installation), same
 * as readConductorAppTree.
 */
export async function openConductorAppRemovalPr(params: {
  slug: string
  branch: string
  prTitle: string
  prBody: string
}): Promise<RemovalPrResult> {
  const { slug, branch, prTitle, prBody } = params
  const token = conductorReadToken()
  if (!token) {
    throw createError({
      statusCode: 503,
      statusMessage:
        'Conductor GitHub write access is not configured (GITHUB_TOKEN).',
    })
  }

  const refRes = await conductorApi(
    `/git/ref/heads/${CONDUCTOR_DEFAULT_BRANCH}`,
    token,
  )
  if (!refRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Conductor main lookup failed (${refRes.status})`,
    })
  }
  const refData = (await refRes.json()) as { object: { sha: string } }
  const baseSha = refData.object.sha

  const baseCommitRes = await conductorApi(`/git/commits/${baseSha}`, token)
  if (!baseCommitRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Conductor base-commit lookup failed (${baseCommitRes.status})`,
    })
  }
  const baseCommitData = (await baseCommitRes.json()) as {
    tree: { sha: string }
  }
  const baseTreeSha = baseCommitData.tree.sha

  const treeRes = await conductorApi(`/git/trees/${baseSha}?recursive=1`, token)
  if (!treeRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Conductor tree read failed (${treeRes.status})`,
    })
  }
  const treeData = (await treeRes.json()) as {
    tree: Array<{ path: string; type: string; mode: string }>
    truncated?: boolean
  }
  if (treeData.truncated) {
    throw createError({
      statusCode: 502,
      statusMessage:
        'Conductor tree listing was truncated by GitHub -- remove ' +
        `apps/${slug}/ manually.`,
    })
  }

  const prefix = `apps/${slug}/`
  const toDelete = treeData.tree.filter(
    (entry) => entry.type === 'blob' && entry.path.startsWith(prefix),
  )
  if (toDelete.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `apps/${slug}/ has no files to remove at conductor@${baseSha}.`,
    })
  }

  const newTreeRes = await conductorApiWrite(token, '/git/trees', {
    base_tree: baseTreeSha,
    tree: toDelete.map((entry) => ({
      path: entry.path,
      mode: entry.mode,
      type: 'blob',
      sha: null,
    })),
  })
  if (!newTreeRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Conductor removal-tree create failed (${newTreeRes.status})`,
    })
  }
  const newTreeData = (await newTreeRes.json()) as { sha: string }

  const createRefRes = await conductorApiWrite(token, '/git/refs', {
    ref: `refs/heads/${branch}`,
    sha: baseSha,
  })
  // 422 = branch already exists (a retry after a partial failure) -- reuse
  // it, same as pushScaffoldBranchAndOpenPr above.
  if (!createRefRes.ok && createRefRes.status !== 422) {
    throw createError({
      statusCode: 502,
      statusMessage: `Conductor branch creation failed (${createRefRes.status})`,
    })
  }

  const newCommitRes = await conductorApiWrite(token, '/git/commits', {
    message: prTitle,
    tree: newTreeData.sha,
    parents: [baseSha],
  })
  if (!newCommitRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Conductor removal-commit create failed (${newCommitRes.status})`,
    })
  }
  const newCommitData = (await newCommitRes.json()) as { sha: string }

  const updateRefRes = await conductorApiWrite(
    token,
    `/git/refs/heads/${branch}`,
    { sha: newCommitData.sha },
    'PATCH',
  )
  if (!updateRefRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Conductor removal branch update failed (${updateRefRes.status})`,
    })
  }

  const prRes = await conductorApiWrite(token, '/pulls', {
    title: prTitle,
    head: branch,
    base: CONDUCTOR_DEFAULT_BRANCH,
    body: prBody,
  })
  if (!prRes.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Conductor removal-PR creation failed (${prRes.status})`,
    })
  }
  const prData = (await prRes.json()) as { html_url: string; number: number }

  return { branch, prUrl: prData.html_url, prNumber: prData.number }
}

async function conductorApiWrite(
  token: string,
  path: string,
  body: unknown,
  method: 'POST' | 'PATCH' = 'POST',
): Promise<Response> {
  return fetch(`https://api.github.com/repos/${CONDUCTOR_REPO}${path}`, {
    method,
    headers: {
      ...GITHUB_API_HEADERS,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}
