/// <reference types="cypress" />

type RequestHeaders = Record<string, string>

type NormalizedRequest = {
  method: string
  url: string
  headers: RequestHeaders
}

type CleanupRequest = {
  label: string
  method?: 'DELETE' | 'POST' | 'PATCH'
  url: string
  headers?: RequestHeaders
  body?: unknown
  expectedStatuses?: number[]
}

const cleanupEligiblePaths = new Set([
  '/api/art/collection',
  '/api/art/image',
  '/api/bots',
  '/api/characters',
  '/api/chats',
  '/api/code',
  '/api/components',
  '/api/compositions',
  '/api/dreams',
  '/api/icons',
  '/api/logs',
  '/api/milestones',
  '/api/milestones/records',
  '/api/prompts',
  '/api/reactions',
  '/api/resources',
  '/api/rewards',
  '/api/scenarios',
  '/api/server',
  '/api/themes',
  '/api/users/register',
])

const cleanupPathOverrides: Record<string, string> = {
  '/api/art/generate': '/api/art/image',
  '/api/users/register': '/api/users',
}

const normalizeHeaders = (headers: unknown): RequestHeaders => {
  if (!headers || typeof headers !== 'object') return {}

  return Object.entries(headers as Record<string, unknown>).reduce<RequestHeaders>(
    (acc, [key, value]) => {
      if (typeof value === 'string') acc[key] = value
      return acc
    },
    {},
  )
}

const normalizeUrl = (value: unknown): string => {
  if (typeof value === 'string') return value
  return ''
}

const normalizeRequestArgs = (args: unknown[]): NormalizedRequest => {
  if (typeof args[0] === 'object' && args[0] !== null) {
    const options = args[0] as Cypress.RequestOptions

    return {
      method: String(options.method || 'GET').toUpperCase(),
      url: normalizeUrl(options.url),
      headers: normalizeHeaders(options.headers),
    }
  }

  if (typeof args[0] === 'string' && typeof args[1] === 'string') {
    return {
      method: args[0].toUpperCase(),
      url: args[1],
      headers: {},
    }
  }

  return {
    method: 'GET',
    url: normalizeUrl(args[0]),
    headers: {},
  }
}

const getBodyData = (body: unknown): Record<string, unknown> | null => {
  if (!body || typeof body !== 'object') return null

  const record = body as Record<string, unknown>
  const data = record.data

  if (Array.isArray(data)) {
    const first = data[0]
    return first && typeof first === 'object' ? (first as Record<string, unknown>) : null
  }

  if (data && typeof data === 'object') return data as Record<string, unknown>
  return record
}

const getCreatedId = (body: unknown): number | null => {
  const data = getBodyData(body)
  const parsed = Number(data?.id)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const getCleanupUrl = (requestUrl: string, responseBody: unknown): string | null => {
  const createdId = getCreatedId(responseBody)
  if (!createdId) return null

  const baseUrl = String(Cypress.config('baseUrl') || 'https://kind-robots.vercel.app')
  const url = new URL(requestUrl, baseUrl)
  const path = url.pathname.replace(/\/+$/, '')
  const cleanupPath = cleanupPathOverrides[path] || path

  if (!cleanupEligiblePaths.has(path) && !cleanupPathOverrides[path]) return null

  return `${url.origin}${cleanupPath}/${createdId}`
}

const registerCleanup = (request: CleanupRequest) => {
  cy.task('cypressCleanup:register', request, { log: false })
}

const maybeRegisterCreatedRecord = (
  request: NormalizedRequest,
  response: Cypress.Response<unknown>,
) => {
  if (request.method !== 'POST') return
  if (![200, 201, 202].includes(response.status)) return

  const cleanupUrl = getCleanupUrl(request.url, response.body)
  if (!cleanupUrl) return

  registerCleanup({
    label: cleanupUrl,
    method: 'DELETE',
    url: cleanupUrl,
    headers: request.headers,
    expectedStatuses: [200, 202, 204, 401, 403, 404],
  })
}

;(Cypress.Commands.overwrite as unknown as Function)(
  'request',
  (originalFn: (...args: unknown[]) => Cypress.Chainable, ...args: unknown[]) => {
    const request = normalizeRequestArgs(args)

    return originalFn(...args).then((response: Cypress.Response<unknown>) => {
      maybeRegisterCreatedRecord(request, response)
      return response
    })
  },
)
