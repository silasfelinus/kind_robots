// /cypress/e2e/api/comfy.cy.ts
/// <reference types="cypress" />

interface ComfyResponse {
  success: boolean
  promptId?: string
  status?: 'running' | 'done' | 'cached' | 'error' | 'unknown' | 'pending'
  stillProcessing?: boolean
  outputs?: Record<string, unknown>
  nodeErrors?: Record<string, unknown>
  meta?: Record<string, unknown>
  messages?: unknown[]
  prompt?: Record<string, unknown> | null
  inQueue?: boolean
  queuePosition?: number
  error?: string
  jobId?: string
}

describe('Comfy API Integration', () => {
  const API_BASE = Cypress.env('API_BASE') ?? 'http://localhost:3000'
  const LOCAL_COMFY_BASE =
    Cypress.env('LOCAL_COMFY_BASE') ?? 'http://127.0.0.1:8188'

  const apiBase = `${API_BASE}/api/comfy`
  const apiKey = Cypress.env('API_KEY')

  before(() => {
    expect(apiKey, 'Cypress.env("API_KEY")').to.be.a('string').and.not.be.empty
    expect(API_BASE, 'API_BASE should be local during tests').to.match(
      /^http:\/\/(localhost|127\.0\.0\.1):\d+/,
    )
    expect(
      LOCAL_COMFY_BASE,
      'LOCAL_COMFY_BASE should be local during tests',
    ).to.match(/^http:\/\/(localhost|127\.0\.0\.1):\d+/)
  })

  function pollPromptStatus(
    promptId: string,
    timeoutMs = 60000,
    intervalMs = 2000,
  ): Cypress.Chainable<ComfyResponse> {
    let elapsed = 0

    const check = (): Cypress.Chainable<ComfyResponse> =>
      cy
        .request<ComfyResponse>({
          method: 'GET',
          url: `${apiBase}/prompt/${promptId}`,
          failOnStatusCode: false,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })
        .then((res) => {
          const body = res.body as ComfyResponse
          const done = body.status === 'done' || body.status === 'cached'
          const keepWaiting =
            (body.stillProcessing ||
              body.status === 'running' ||
              body.status === 'pending') &&
            elapsed < timeoutMs

          if (!done && keepWaiting) {
            elapsed += intervalMs
            return cy.wait(intervalMs).then(check)
          }

          return cy.wrap(body)
        })

    return check()
  }

  it('submits a simple text→image FLUX job and completes successfully', () => {
    cy.request<ComfyResponse>({
      method: 'POST',
      url: apiBase,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: {
        modelType: 'flux',
        inputType: 'text',
        outputType: 'image',
        prompt:
          'candid photograph at exotic alien sci-fi public hot spring, venusian moon, elaborate swirling sky, showering large magical bubbles floating around scene and reflecting the beautiful galaxy in space, Plum and rainbow braided hair streaks, alien women box jellyfish hybrids bathing in background',
      },
      failOnStatusCode: false,
    })
      .its('body')
      .then((body) => {
        expect(body.success, 'submit success').to.eq(true)
        expect(body.promptId, 'promptId returned').to.be.a('string')

        const promptId = body.promptId as string

        return pollPromptStatus(promptId).then((finalRes) => {
          expect(finalRes.success, 'final success').to.eq(true)
          expect(finalRes.status).to.be.oneOf(['done', 'cached'])
        })
      })
  })

  it('submits a local FLUX Kontext graph and completes successfully', () => {
    cy.request<ComfyResponse>({
      method: 'POST',
      url: `${apiBase}/extras/kontext`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: {
        apiUrl: `${LOCAL_COMFY_BASE}/prompt`,
        imageData:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADjgGRzSVcrwAAAABJRU5ErkJggg==',
        wildcard_text: '__flux/lsd__',
      },
      failOnStatusCode: false,
    })
      .its('body')
      .then((body) => {
        expect(body.success, 'submit success').to.eq(true)
        expect(body.promptId, 'promptId returned').to.be.a('string')

        const promptId = body.promptId as string

        return pollPromptStatus(promptId).then((finalRes) => {
          expect(finalRes.success, 'final success').to.eq(true)
          expect(finalRes.status).to.be.oneOf(['done', 'cached'])
        })
      })
  })

  it('handles unknown promptId gracefully', () => {
    cy.request<ComfyResponse>({
      method: 'GET',
      url: `${apiBase}/prompt/does-not-exist`,
      failOnStatusCode: false,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }).then((res) => {
      const body = res.body as ComfyResponse

      expect(body.success).to.be.false
      expect(body.status).to.be.oneOf(['unknown', 'error'])
    })
  })
})
