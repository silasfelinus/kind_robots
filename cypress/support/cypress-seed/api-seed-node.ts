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
  user?: {
    id?: number
    token?: string
  }
}

const defaultApiBase = 'https://kind-robots.vercel.app/api'
const defaultTestPassword = 'testtest12'
const seedDir = path.resolve('.cypress-cache')
const seedFile = path.join(seedDir, 'api-seed.json')
const localSyntheticRunId = `local-node-${Date.now()}-${process.pid}`

let memorySeed: CypressApiSeedState | undefined

const positiveNumber = (value: unknown): number | undefined => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const cleanHeaderValue = (value: unknown, maxLength = 220) =>
  String(value ?? '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .trim()
    .slice(0, maxLength)

const syntheticHeaders = (spec = 'cypress-seed') => ({
  'x-kindrobots-test-source': cleanHeaderValue(
    process.env.CYPRESS_SYNTHETIC_SOURCE || 'cypress-node',
  ),
  'x-kindrobots-test-run-id': cleanHeaderValue(
    process.env.CYPRESS_SYNTHETIC_RUN_ID || localSyntheticRunId,
  ),
  'x-kindrobots-test-spec': cleanHeaderValue(spec),
})

const jsonRequest = async <T = unknown>(url: string, init: RequestInit = {}) => {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...syntheticHeaders(),
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

  return {
    status: response.status,
    body,
  }
}

const extractUserId = (body: ApiResponse<Record<string, unknown>>) => {
  const data = body.data && typeof body.data === 'object' ? body.data : {}
  const id = positiveNumber(body.user?.id) || positiveNumber(data.id)

  if (!id) {
    throw new Error(`Unable to extract user id: ${JSON.stringify(body)}`)
  }

  return id
}

const extractToken = (body: ApiResponse) => {
  const data =
    body.data && typeof body.data === 'object'
      ? (body.data as Record<string, unknown>)
      : {}
  const token = String(data.token || body.token || body.user?.token || '')

  if (!token || token.length < 20) {
    throw new Error(`Unable to extract login token: ${JSON.stringify(body)}`)
  }

  return token
}

const resolveApiBase = (env: Record<string, unknown>) =>
  String(process.env.BASE_API_URL || env.BASE_API_URL || defaultApiBase).replace(
    /\/+$/,
    '',
  )

const resolveAdminKey = (env: Record<string, unknown>) =>
  String(
    process.env.BETA_ADMIN_TOKEN ||
      process.env.API_KEY ||
      env.BETA_ADMIN_TOKEN ||
      env.API_KEY ||
      '',
  )

const makeSeedUser = async (
  apiBase: string,
  adminKey: string,
  runId: string,
  role: string,
): Promise<CypressApiSeedUser> => {
  const username = `cypress-${role}-${runId}`
  const email = `${username}@example.com`
  const password = defaultTestPassword

  const register = await jsonRequest<Record<string, unknown>>(
    `${apiBase}/users/register`,
    {
      method: 'POST',
      headers: {
        'x-api-key': adminKey,
      },
      body: JSON.stringify({ username, email, password }),
    },
  )

  if (![200, 201].includes(register.status)) {
    throw new Error(
      `Seed user register failed for ${role}: ${register.status} ${JSON.stringify(register.body)}`,
    )
  }

  const id = extractUserId(register.body)

  const login = await jsonRequest(`${apiBase}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

  if (login.status !== 200 || login.body.success === false) {
    throw new Error(
      `Seed user login failed for ${role}: ${login.status} ${JSON.stringify(login.body)}`,
    )
  }

  const token = extractToken(login.body)

  return { id, username, email, password, token }
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

  if (!adminKey) {
    throw new Error('Cypress API seed requires API_KEY or BETA_ADMIN_TOKEN.')
  }

  const cached = readSeed()

  if (cached?.apiBase === apiBase && cached?.adminKey === adminKey) {
    memorySeed = cached
    return cached
  }

  const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`

  const seed: CypressApiSeedState = {
    runId,
    apiBase,
    adminKey,
    user: await makeSeedUser(apiBase, adminKey, runId, 'user'),
    secondUser: await makeSeedUser(apiBase, adminKey, runId, 'target'),
    thirdUser: await makeSeedUser(apiBase, adminKey, runId, 'third'),
    fixtures: {},
  }

  writeSeed(seed)
  memorySeed = seed

  return seed
}

export const isSeedUserId = async (
  env: Record<string, unknown>,
  userId: number,
) => {
  const seed = await ensureCypressApiSeed(env)
  return [seed.user.id, seed.secondUser.id, seed.thirdUser.id].includes(
    Number(userId),
  )
}
