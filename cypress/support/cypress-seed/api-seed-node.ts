import fs from 'node:fs'
import path from 'node:path'

type CypressApiSeedUser = {
  id: number
  username: string
  email: string
  password: string
  token: string
}

export type CypressApiSeedState = {
  runId: string
  apiBase: string
  adminKey: string
  user: CypressApiSeedUser
  secondUser: CypressApiSeedUser
  thirdUser: CypressApiSeedUser
  fixtures: Record<string, number | string | boolean | null>
}

type ApiResponse<T = unknown> = {
  success?: boolean
  message?: string
  data?: T
  token?: string
  user?: { id?: number; token?: string }
}

type ListedUser = {
  id?: number
  username?: string | null
  email?: string | null
  createdAt?: string | null
  Role?: string | null
}

const defaultApiBase = 'https://kind-robots.vercel.app/api'
const defaultTestPassword = 'testtest12'
const seedDir = path.resolve('.cypress-cache')
const seedFile = path.join(seedDir, 'api-seed.json')
const orphanReportFile = path.join(seedDir, 'orphan-user-sweep-latest.json')
const localSyntheticRunId = `local-node-${Date.now()}-${process.pid}`
const defaultOrphanAgeMs = 2 * 60 * 60 * 1000

let memorySeed: CypressApiSeedState | undefined

const positiveNumber = (value: unknown): number | undefined => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const cleanHeaderValue = (value: unknown, maxLength = 220) =>
  String(value ?? '').replace(/[^\x20-\x7E]/g, ' ').trim().slice(0, maxLength)

const syntheticHeaders = (spec = 'cypress-seed') => ({
  'x-kindrobots-test-source': cleanHeaderValue(
    process.env.CYPRESS_SYNTHETIC_SOURCE || 'cypress-node',
  ),
  'x-kindrobots-test-run-id': cleanHeaderValue(
    process.env.CYPRESS_SYNTHETIC_RUN_ID || localSyntheticRunId,
  ),
  'x-kindrobots-test-spec': cleanHeaderValue(spec),
})

const jsonRequest = async <T = unknown>(url: string, init: RequestInit = {}, spec = 'cypress-seed') => {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...syntheticHeaders(spec),
      ...(init.headers || {}),
    },
  })

  const text = await response.text()
  let body: ApiResponse<T>
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { success: false, message: text }
  }
  return { status: response.status, body }
}

const extractUserId = (body: ApiResponse<Record<string, unknown>>) => {
  const data = body.data && typeof body.data === 'object' ? body.data : {}
  const id = positiveNumber(body.user?.id) || positiveNumber(data.id)
  if (!id) throw new Error(`Unable to extract user id: ${JSON.stringify(body)}`)
  return id
}

const extractToken = (body: ApiResponse) => {
  const data = body.data && typeof body.data === 'object'
    ? (body.data as Record<string, unknown>)
    : {}
  const token = String(data.token || body.token || body.user?.token || '')
  if (!token || token.length < 20) {
    throw new Error(`Unable to extract login token: ${JSON.stringify(body)}`)
  }
  return token
}

const resolveApiBase = (env: Record<string, unknown>) =>
  String(process.env.BASE_API_URL || env.BASE_API_URL || defaultApiBase).replace(/\/+$/, '')

const resolveAdminKey = (env: Record<string, unknown>) =>
  String(
    process.env.BETA_ADMIN_TOKEN ||
      process.env.API_KEY ||
      env.BETA_ADMIN_TOKEN ||
      env.API_KEY ||
      '',
  )

const adminHeaders = (adminKey: string) => ({
  'x-api-key': adminKey,
  'x-beta-admin-token': adminKey,
})

const isCypressUser = (user: ListedUser) => {
  const username = String(user.username || '')
  const email = String(user.email || '')
  return /^cypress-(?:user|target|third)-/i.test(username) ||
    /^cypress-user-/i.test(username) ||
    /@example\.com$/i.test(email) && /^cypress-/i.test(email)
}

const userAgeMs = (user: ListedUser) => {
  const created = Date.parse(String(user.createdAt || ''))
  return Number.isFinite(created) ? Date.now() - created : Number.POSITIVE_INFINITY
}

export const sweepStaleCypressUsers = async (env: Record<string, unknown>) => {
  const apiBase = resolveApiBase(env)
  const adminKey = resolveAdminKey(env)
  if (!adminKey) throw new Error('Cypress orphan sweep requires API_KEY or BETA_ADMIN_TOKEN.')

  const configuredAge = Number(
    process.env.CYPRESS_ORPHAN_MAX_AGE_MS || env.CYPRESS_ORPHAN_MAX_AGE_MS,
  )
  const maxAgeMs = Number.isFinite(configuredAge) && configuredAge >= 0
    ? configuredAge
    : defaultOrphanAgeMs

  const listed = await jsonRequest<ListedUser[]>(
    `${apiBase}/users`,
    { headers: adminHeaders(adminKey) },
    'cypress-orphan-sweep',
  )
  const rawUsers = Array.isArray(listed.body.data) ? listed.body.data : []
  const candidates = rawUsers.filter((user) =>
    isCypressUser(user) && user.Role !== 'ADMIN' && userAgeMs(user) >= maxAgeMs,
  )

  const results: unknown[] = []
  for (const user of candidates) {
    const id = positiveNumber(user.id)
    if (!id) continue
    const deleted = await jsonRequest(
      `${apiBase}/users/${id}`,
      { method: 'DELETE', headers: adminHeaders(adminKey) },
      'cypress-orphan-sweep',
    )
    results.push({
      id,
      username: user.username,
      ageMs: userAgeMs(user),
      status: deleted.status,
      ok: [200, 202, 204, 404].includes(deleted.status),
      body: deleted.body,
    })
  }

  fs.mkdirSync(seedDir, { recursive: true })
  fs.writeFileSync(
    orphanReportFile,
    `${JSON.stringify({ createdAt: new Date().toISOString(), maxAgeMs, candidates: candidates.length, results }, null, 2)}\n`,
  )

  const failures = results.filter((item: any) => !item.ok)
  if (failures.length > 0) {
    throw new Error(`Failed to remove ${failures.length} abandoned Cypress users: ${JSON.stringify(failures)}`)
  }
  return results
}

const makeSeedUser = async (
  apiBase: string,
  adminKey: string,
  runId: string,
  role: string,
): Promise<CypressApiSeedUser> => {
  const username = `cypress-${role}-${runId}`
  const email = `${username}@example.com`
  const password = defaultTestPassword

  const register = await jsonRequest<Record<string, unknown>>(`${apiBase}/users/register`, {
    method: 'POST',
    headers: { 'x-api-key': adminKey },
    body: JSON.stringify({ username, email, password }),
  })
  if (![200, 201].includes(register.status)) {
    throw new Error(`Seed user register failed for ${role}: ${register.status} ${JSON.stringify(register.body)}`)
  }

  const id = extractUserId(register.body)
  const login = await jsonRequest(`${apiBase}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  if (login.status !== 200 || login.body.success === false) {
    // Registration succeeded but login failed. Remove the partial user immediately.
    await jsonRequest(
      `${apiBase}/users/${id}`,
      { method: 'DELETE', headers: adminHeaders(adminKey) },
      'cypress-seed-rollback',
    )
    throw new Error(`Seed user login failed for ${role}: ${login.status} ${JSON.stringify(login.body)}`)
  }

  return { id, username, email, password, token: extractToken(login.body) }
}

const readSeed = (): CypressApiSeedState | undefined => {
  if (!fs.existsSync(seedFile)) return undefined
  try {
    return JSON.parse(fs.readFileSync(seedFile, 'utf8')) as CypressApiSeedState
  } catch {
    return undefined
  }
}

const writeSeed = (seed: CypressApiSeedState) => {
  fs.mkdirSync(seedDir, { recursive: true })
  fs.writeFileSync(seedFile, `${JSON.stringify(seed, null, 2)}\n`)
}

export const clearCypressApiSeed = () => {
  memorySeed = undefined
  if (fs.existsSync(seedFile)) fs.unlinkSync(seedFile)
}

export const ensureCypressApiSeed = async (env: Record<string, unknown>) => {
  if (memorySeed) return memorySeed

  const apiBase = resolveApiBase(env)
  const adminKey = resolveAdminKey(env)
  if (!adminKey) throw new Error('Cypress API seed requires API_KEY or BETA_ADMIN_TOKEN.')

  await sweepStaleCypressUsers(env)

  const cached = readSeed()
  if (cached?.apiBase === apiBase && cached?.adminKey === adminKey) {
    memorySeed = cached
    return cached
  }

  const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
  const created: CypressApiSeedUser[] = []
  try {
    created.push(await makeSeedUser(apiBase, adminKey, runId, 'user'))
    created.push(await makeSeedUser(apiBase, adminKey, runId, 'target'))
    created.push(await makeSeedUser(apiBase, adminKey, runId, 'third'))
  } catch (error) {
    for (const user of created.reverse()) {
      await jsonRequest(
        `${apiBase}/users/${user.id}`,
        { method: 'DELETE', headers: adminHeaders(adminKey) },
        'cypress-seed-rollback',
      )
    }
    throw error
  }

  const seed: CypressApiSeedState = {
    runId,
    apiBase,
    adminKey,
    user: created[0]!,
    secondUser: created[1]!,
    thirdUser: created[2]!,
    fixtures: {},
  }
  writeSeed(seed)
  memorySeed = seed
  return seed
}

export const isSeedUserId = async (env: Record<string, unknown>, userId: number) => {
  const seed = await ensureCypressApiSeed(env)
  return [seed.user.id, seed.secondUser.id, seed.thirdUser.id].includes(Number(userId))
}
