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

type LooseOverwrite = (
  name: string,
  fn: (originalFn: (...args: unknown[]) => Cypress.Chainable, ...args: unknown[]) => Cypress.Chainable,
) => void

const apiKeyHeaderName = ['x', 'api', 'key'].join('-')

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

const hasAuthHeader = (headers: RequestHeaders) => {
  return Object.keys(headers).some((key) => {
    const normalized = key.toLowerCase()
    return normalized === 'authorization' || normalized === apiKeyHeaderName
  })
}

const withCleanupAuth = (headers: RequestHeaders): RequestHeaders => {
  if (hasAuthHeader(headers)) return headers

  const adminToken = String(Cypress.env('BETA_ADMIN_TOKEN') || Cypress.env('API_KEY') || '')
  if (!adminToken) return headers

  return {
    ...headers,
    [apiKeyHeaderName]: adminToken,
  }
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

const positiveId = (value: unknown): number | null => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const getCreatedIdsFromValue = (value: unknown): number[] => {
  if (Array.isArray(value)) return value.flatMap((entry) => getCreatedIdsFromValue(entry))
  if (!value || typeof value !== 'object') return []

  const record = value as Record<string, unknown>
  const directId = positiveId(record.id)

  return directId ? [directId] : []
}

const getCreatedIds = (body: unknown): number[] => {
  if (!body || typeof body !== 'object') return []

  const record = body as Record<string, unknown>
  const fromData = getCreatedIdsFromValue(record.data)
  if (fromData.length) return [...new Set(fromData)]

  return [...new Set(getCreatedIdsFromValue(record))]
}

const getCleanupRequests = (
  request: NormalizedRequest,
  response: Cypress.Response<unknown>,
): CleanupRequest[] => {
  if (request.method !== 'POST') return []
  if (![200, 201, 202].includes(response.status)) return []

  const baseUrl = String(Cypress.config('baseUrl') || 'https://kind-robots.vercel.app')
  const url = new URL(request.url, baseUrl)
  const path = url.pathname.replace(/\/+$/, '')
  const cleanupPath = cleanupPathOverrides[path] || path

  if (!cleanupEligiblePaths.has(path) && !cleanupPathOverrides[path]) return []

  return getCreatedIds(response.body).map((createdId) => {
    const cleanupUrl = `${url.origin}${cleanupPath}/${createdId}`

    return {
      label: cleanupUrl,
      method: 'DELETE' as const,
      url: cleanupUrl,
      headers: withCleanupAuth(request.headers),
      expectedStatuses: [200, 202, 204, 404],
    }
  })
}

const registerCleanup = (request: CleanupRequest): Cypress.Chainable<unknown> => {
  return cy.task('cypressCleanup:register', request, { log: false })
}

const registerCleanups = (requests: CleanupRequest[]): Cypress.Chainable<unknown> => {
  let chain = cy.wrap(undefined, { log: false }) as Cypress.Chainable<unknown>

  for (const request of requests) {
    chain = chain.then(() => registerCleanup(request))
  }

  return chain
}

;(Cypress.Commands.overwrite as unknown as LooseOverwrite)(
  'request',
  (originalFn, ...args) => {
    const request = normalizeRequestArgs(args)

    return originalFn(...args).then((response: Cypress.Response<unknown>) => {
      const cleanupRequests = getCleanupRequests(request, response)

      if (!cleanupRequests.length) return cy.wrap(response, { log: false })

      return registerCleanups(cleanupRequests).then(() => response)
    })
  },
)
