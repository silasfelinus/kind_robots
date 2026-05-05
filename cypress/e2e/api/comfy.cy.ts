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
  let apiBase = 'https://kind-robots.vercel.app/api/comfy'
  let comfyTestServerId = 25
  let apiKey = ''

  before(() => {
    cy.env(['API_BASE', 'COMFY_TEST_SERVER_ID', 'API_KEY']).then((env) => {
      const rawApiBase = String(
        env.API_BASE || 'https://kind-robots.vercel.app',
      )
      const cleanApiBase = rawApiBase.replace(/\/+$/, '')
      const parsedServerId = Number(env.COMFY_TEST_SERVER_ID ?? 25)

      apiBase = `${cleanApiBase}/api/comfy`
      comfyTestServerId = Number.isFinite(parsedServerId) ? parsedServerId : 25
      apiKey = String(env.API_KEY || '')

      expect(apiKey, 'API_KEY').to.be.a('string').and.not.be.empty
      expect(cleanApiBase, 'API_BASE').to.be.a('string').and.not.be.empty
      expect(comfyTestServerId, 'COMFY_TEST_SERVER_ID').to.be.a('number')
      expect(comfyTestServerId, 'COMFY_TEST_SERVER_ID').to.be.greaterThan(0)
    })
  })

  function pollPromptStatus(
    promptId: string,
    serverId: number,
    timeoutMs = 60000,
    intervalMs = 2000,
  ): Cypress.Chainable<ComfyResponse> {
    let elapsed = 0

    const check = (): Cypress.Chainable<ComfyResponse> =>
      cy
        .request<ComfyResponse>({
          method: 'GET',
          url: `${apiBase}/prompt/${promptId}?serverId=${serverId}`,
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
        serverId: comfyTestServerId,
        modelType: 'flux',
        inputType: 'text',
        outputType: 'image',
        prompt:
          'candid photograph at exotic alien sci-fi public hot spring, venusian moon, elaborate swirling sky, showering large magical bubbles floating around scene and reflecting the beautiful galaxy in space, plum and rainbow braided hair streaks, alien women box jellyfish hybrids bathing in background',
      },
      failOnStatusCode: false,
      timeout: 120000,
    })
      .its('body')
      .then((body) => {
        cy.log('Comfy submit response:', JSON.stringify(body))

        expect(
          body.success,
          `submit success — body: ${JSON.stringify(body)}`,
        ).to.eq(true)

        expect(body.promptId, 'promptId returned').to.be.a('string').and.not.be
          .empty

        const promptId = body.promptId as string

        return pollPromptStatus(promptId, comfyTestServerId, 120000).then(
          (finalRes) => {
            cy.log('Comfy final response:', JSON.stringify(finalRes))

            expect(
              finalRes.success,
              `final success — body: ${JSON.stringify(finalRes)}`,
            ).to.eq(true)

            expect(finalRes.status).to.be.oneOf(['done', 'cached'])
          },
        )
      })
  })

  it('submits a FLUX Kontext graph and completes successfully', () => {
    cy.request<ComfyResponse>({
      method: 'POST',
      url: `${apiBase}/extras/kontext`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: {
        serverId: comfyTestServerId,
        imageData:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADjgGRzSVcrwAAAABJRU5ErkJggg==',
        wildcard_text: '__flux/lsd__',
      },
      failOnStatusCode: false,
      timeout: 120000,
    })
      .its('body')
      .then((body) => {
        cy.log('Kontext submit response:', JSON.stringify(body))

        expect(
          body.success,
          `submit success — body: ${JSON.stringify(body)}`,
        ).to.eq(true)

        expect(body.promptId, 'promptId returned').to.be.a('string').and.not.be
          .empty

        const promptId = body.promptId as string

        return pollPromptStatus(promptId, comfyTestServerId, 120000).then(
          (finalRes) => {
            cy.log('Kontext final response:', JSON.stringify(finalRes))

            expect(
              finalRes.success,
              `final success — body: ${JSON.stringify(finalRes)}`,
            ).to.eq(true)

            expect(finalRes.status).to.be.oneOf(['done', 'cached'])
          },
        )
      })
  })

  it('handles unknown promptId gracefully', () => {
    cy.request<ComfyResponse>({
      method: 'GET',
      url: `${apiBase}/prompt/does-not-exist?serverId=${comfyTestServerId}`,
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
