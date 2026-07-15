/// <reference types="cypress" />

export type CleanupRequest = {
  label: string
  method?: 'DELETE' | 'POST' | 'PATCH'
  url: string
  headers?: Record<string, string>
  body?: unknown
  expectedStatuses?: number[]
}

type RequestOptionsLike = Record<string, unknown> & {
  method?: string
  headers?: Record<string, string>
  failOnStatusCode?: boolean
  retryOnStatusCodeFailure?: boolean
  retryOnNetworkFailure?: boolean
}

type CurrentTestLike = {
  title?: string
  titlePath?: string[]
}

const httpMethods = new Set([
  'CONNECT',
  'DELETE',
  'GET',
  'HEAD',
  'OPTIONS',
  'PATCH',
  'POST',
  'PUT',
  'TRACE',
])

const retrySafeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

const cleanHeaderValue = (value: unknown, maxLength = 220) =>
  String(value ?? '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .trim()
    .slice(0, maxLength)

// Synthetic-traffic identifiers arrive as CYPRESS_SYNTHETIC_* env vars in CI.
// `cypress.config.ts` sets `allowCypressEnv: false`, so the synchronous
// `Cypress.env()` throws (the suite was migrated to the async `cy.env()`
// command, but this request overwrite runs synchronously). Capture the values
// once via `cy.env()` in a root `before` hook into a module cache the
// synchronous overwrite can read. Values fall back to the local-run defaults
// until the hook populates them.
let syntheticSource = 'cypress'
let syntheticRunId = 'local-cypress'

type SyntheticEnv = {
  SYNTHETIC_SOURCE?: string
  SYNTHETIC_RUN_ID?: string
}

before(() => {
  cy.env(['SYNTHETIC_SOURCE', 'SYNTHETIC_RUN_ID']).then((env: SyntheticEnv) => {
    if (env.SYNTHETIC_SOURCE) syntheticSource = env.SYNTHETIC_SOURCE
    if (env.SYNTHETIC_RUN_ID) syntheticRunId = env.SYNTHETIC_RUN_ID
  })
})

const syntheticTestHeaders = () => {
  const currentTest = Cypress.currentTest as CurrentTestLike | undefined
  const titlePath = Array.isArray(currentTest?.titlePath)
    ? currentTest.titlePath.join(' > ')
    : currentTest?.title

  const headers: Record<string, string> = {
    'x-kindrobots-test-source': cleanHeaderValue(syntheticSource),
    'x-kindrobots-test-run-id': cleanHeaderValue(syntheticRunId),
    'x-kindrobots-test-spec': cleanHeaderValue(
      Cypress.spec.relative || Cypress.spec.name || 'unknown-spec',
    ),
  }

  if (titlePath) {
    headers['x-kindrobots-test-name'] = cleanHeaderValue(titlePath)
  }

  return headers
}

const withSyntheticHeaders = (options: RequestOptionsLike) => {
  const method = String(options.method || 'GET').toUpperCase()
  const retrySafeStatusFailure =
    options.failOnStatusCode !== false && retrySafeMethods.has(method)

  return {
    ...options,
    // Cypress's status retry can duplicate POST/PATCH/DELETE side effects when
    // the server commits but the response is lost. Enable it only for safe
    // reads. Write resilience belongs inside the API/database layer.
    ...(retrySafeStatusFailure && options.retryOnStatusCodeFailure === undefined
      ? { retryOnStatusCodeFailure: true }
      : {}),
    ...(options.retryOnNetworkFailure === undefined
      ? { retryOnNetworkFailure: retrySafeMethods.has(method) }
      : {}),
    headers: {
      ...(options.headers || {}),
      ...syntheticTestHeaders(),
    },
  }
}

declare global {
  namespace Cypress {
    interface Chainable {
      registerApiCleanup(request: CleanupRequest): Chainable<unknown>
    }
  }
}

// cy.request runs from Cypress's Node process, so browser interceptors cannot tag
// it. Overwrite every supported request overload to add searchable synthetic-test
// metadata to production requests without changing individual specs.
;(Cypress.Commands.overwrite as any)(
  'request',
  (originalFn: (...args: any[]) => unknown, ...args: any[]) => {
    const [first, second, third] = args

    if (first && typeof first === 'object' && !Array.isArray(first)) {
      return originalFn(withSyntheticHeaders(first as RequestOptionsLike))
    }

    if (
      typeof first === 'string' &&
      typeof second === 'string' &&
      httpMethods.has(first.toUpperCase())
    ) {
      return originalFn(
        withSyntheticHeaders({
          method: first,
          url: second,
          ...(third === undefined ? {} : { body: third }),
        }),
      )
    }

    if (typeof first === 'string') {
      return originalFn(
        withSyntheticHeaders({
          method: 'GET',
          url: first,
          ...(second === undefined ? {} : { body: second }),
        }),
      )
    }

    return originalFn(...args)
  },
)

Cypress.Commands.add('registerApiCleanup', (request: CleanupRequest) => {
  return cy.task('cypressCleanup:register', request, { log: false })
})
