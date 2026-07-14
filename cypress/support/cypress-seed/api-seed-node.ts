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
  error?: unknown
}

type ApiAttempt = {
  attempt: number
  status?: number
  retryable: boolean
  message?: string
  error?: string
}

type JsonRequestResult<T = unknown> = {
  status: number
  body: ApiResponse<T>
  attempts: ApiAttempt[]
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
const defaultRequestAttempts = 5
const retryableStatuses = new Set([408, 425, 429, 500, 502, 503, 504])

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

const requestAttemptLimit = () => {
  const configured = positiveNumber(process.env.CYPRESS_HTTP_MAX_ATTEMPTS)
  return configured ? Math.max(1, Math.min(10, Math.floor(configured))) : defaultRequestAttempts
}

const retryDelayMs = (attempt: number) => Math.min(500 * 2 ** Math.max(0, attempt - 1), 4000)

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const responseMessage = (body: ApiResponse) => {
  if (body.message) return body.message
  if (body.error === undefined) return undefined

  if (typeof body.error === 'string') return body.error
  try {
    return JSON.stringify(body.error)
  } catch {
    return String(body.error)
  }
}

const jsonRequest = async <T = unknown>(
  url: string,
  init: RequestInit = {},
  spec = 'cypress-seed',
): Promise<JsonRequestResult<T>> => {
  const attempts: ApiAttempt[] = []
  const maxAttempts = requestAttemptLimit()

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
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

      const retryable = retryableStatuses.has(response.status)
      attempts.push({
        attempt,
        status: response.status,
        retryable,
        message: responseMessage(body),
      })

      if (!retryable || attempt === maxAttempts) {
        return { status: response.status, body, attempts }
      }

      const delayMs = retryDelayMs(attempt)
      console.warn(
        `[cypress-seed] transient HTTP ${response.status} for ${spec}; ` +
          `retrying ${attempt + 1}/${maxAttempts} in ${delayMs}ms`,
      )
      await wait(delayMs)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      attempts.push({ attempt, retryable: true, error: errorMessage })

      if (attempt === maxAttempts) {
        throw new Error(
          `Cypress seed request failed after ${maxAttempts} attempts: ` +
            `${init.method || 'GET'} ${url} ${JSON.stringify(attempts)}`,
        )
      }

      const delayMs = retryDelayMs(attempt)
      console.warn(
        `[cypress-seed] transient fetch error for ${spec}: ${errorMessage}; ` +
          `retrying ${attempt + 1}/${maxAttempts} in ${delayMs}ms`,
      )
      await wait(delayMs)
    }
  }

  throw new Error(`Cypress seed request exhausted without a result: ${init.method || 'GET'} ${url}`)
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

const listedUsersFromResponse = (response: JsonRequestResult<ListedUser[]>) => {
  if (response.status !== 200 || response.body.success === false) {
    throw new Error(
      `Unable to list Cypress users: ${response.status} ` +
        `${JSON.stringify(response.body)} attempts=${JSON.stringify(response.attempts)}`,
    )
  }
  return Array.isArray(response.body.data) ? response.body.data : []
}

const findUserIdByUsername = async (
  apiBase: string,
  adminKey: string,
  username: string,
): Promise<number | undefined> => {
  const listed = await jsonRequest<ListedUser[]>(
    `${apiBase}/users`,
    { headers: adminHeaders(adminKey) },
    'cypress-seed-user-lookup',
  )
  const users = listedUsersFromResponse(listed)
  return positiveNumber(users.find((user) => user.username === username)?.id)
}

const deleteSeedUserById = async (
  apiBase: string,
  adminKey: string,
  id: number,
  spec = 'cypress-seed-rollback',
) => {
  const deleted = await jsonRequest(
    `${apiBase}/users/${id}`,
    { method: 'DELETE', headers: adminHeaders(adminKey) },
    spec,
  )
  if (![200, 202, 204, 404].includes(deleted.status)) {
    throw new Error(
      `Seed user rollback failed for ${id}: ${deleted.status} ` +
        `${JSON.stringify(deleted.body)} attempts=${JSON.stringify(deleted.attempts)}`,
    )
  }
  return deleted
}

export const sweepStaleCypressUsers = async (
  env: Record<string, unknown>,
  excludedUserIds: number[] = [],
) => {
  const apiBase = resolveApiBase(env)
  const adminKey = resolveAdminKey(env)
  if (!adminKey) throw new Error('Cypress orphan sweep requires API_KEY or BETA_ADMIN_TOKEN.')

  const configuredAge = Number(
    process.env.CYPRESS_ORPHAN_MAX_AGE_MS || env.CYPRESS_ORPHAN_MAX_AGE_MS,
  )
  const maxAgeMs = Number.isFinite(configuredAge) && configuredAge >= 0
    ? configuredAge
    : defaultOrphanAgeMs
  const excludedIds = new Set(excludedUserIds.map(Number))

  const listed = await jsonRequest<ListedUser[]>(
    `${apiBase}/users`,
    { headers: adminHeaders(adminKey) },
    'cypress-orphan-sweep',
  )
  const rawUsers = listedUsersFromResponse(listed)
  const candidates = rawUsers.filter((user) => {
    const id = positiveNumber(user.id)
    return Boolean(
      id &&
      !excludedIds.has(id) &&
      isCypressUser(user) &&
      user.Role !== 'ADMIN' &&
      userAgeMs(user) >= maxAgeMs,
    )
  })

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
      attempts: deleted.attempts,
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

  const registrationSucceeded = [200, 201].includes(register.status)
  const registrationAmbiguous = register.status === 409 ||
    register.attempts.some((attempt) => attempt.retryable)

  if (!registrationSucceeded && !registrationAmbiguous) {
    throw new Error(
      `Seed user register failed for ${role}: ${register.status} ` +
        `${JSON.stringify(register.body)} attempts=${JSON.stringify(register.attempts)}`,
    )
  }

  let id = registrationSucceeded ? extractUserId(register.body) : undefined

  const login = await jsonRequest<Record<string, unknown>>(`${apiBase}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

  if (login.status === 200 && login.body.success !== false) {
    if (!id) {
      id = extractUserId(login.body)
      console.warn(
        `[cypress-seed] recovered ${role} user ${id} after ambiguous registration ` +
          `(final status ${register.status})`,
      )
    }
    return { id, username, email, password, token: extractToken(login.body) }
  }

  try {
    id = id || await findUserIdByUsername(apiBase, adminKey, username)
    if (id) await deleteSeedUserById(apiBase, adminKey, id)
  } catch (rollbackError) {
    throw new Error(
      `Seed user login failed for ${role}: ${login.status} ${JSON.stringify(login.body)} ` +
        `loginAttempts=${JSON.stringify(login.attempts)}; rollback also failed: ` +
        `${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
    )
  }

  throw new Error(
    `Seed user login failed for ${role}: ${login.status} ${JSON.stringify(login.body)} ` +
      `registerAttempts=${JSON.stringify(register.attempts)} ` +
      `loginAttempts=${JSON.stringify(login.attempts)}`,
  )
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

  const cached = readSeed()
  const reusableCache = cached?.apiBase === apiBase && cached?.adminKey === adminKey
    ? cached
    : undefined
  const cachedUserIds = reusableCache
    ? [reusableCache.user.id, reusableCache.secondUser.id, reusableCache.thirdUser.id]
    : []

  await sweepStaleCypressUsers(env, cachedUserIds)

  if (reusableCache) {
    memorySeed = reusableCache
    return reusableCache
  }

  const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
  const created: CypressApiSeedUser[] = []
  try {
    created.push(await makeSeedUser(apiBase, adminKey, runId, 'user'))
    created.push(await makeSeedUser(apiBase, adminKey, runId, 'target'))
    created.push(await makeSeedUser(apiBase, adminKey, runId, 'third'))
  } catch (error) {
    const rollbackFailures: string[] = []
    for (const user of created.reverse()) {
      try {
        await deleteSeedUserById(apiBase, adminKey, user.id)
      } catch (rollbackError) {
        rollbackFailures.push(
          rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
        )
      }
    }
    if (rollbackFailures.length > 0) {
      throw new Error(
        `${error instanceof Error ? error.message : String(error)}; ` +
          `seed rollback failures=${JSON.stringify(rollbackFailures)}`,
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
