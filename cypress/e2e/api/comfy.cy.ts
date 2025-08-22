// /cypress/e2e/api/comfy.cy.ts
/// <reference types="cypress" />

import comfyTest from '../../../server/api/comfy/json/comfyTest.json'
import fluxKontext from '../../../server/api/comfy/json/fluxKontext.json'

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
  const apiBase = '/api/comfy'

  // Poll until the prompt is done (always return Chainable<ComfyResponse>)
  function pollPromptStatus(
    promptId: string,
    timeoutMs = 30000,
    intervalMs = 2000,
  ): Cypress.Chainable<ComfyResponse> {
    let elapsed = 0

    function check(): Cypress.Chainable<ComfyResponse> {
      return cy
        .request<ComfyResponse>({
          method: 'GET',
          url: `${apiBase}/prompt/${promptId}`,
          failOnStatusCode: false,
        })
        .then((res): Cypress.Chainable<ComfyResponse> => {
          const body = res.body as ComfyResponse
          if (body.stillProcessing && elapsed < timeoutMs) {
            elapsed += intervalMs
            return cy.wait(intervalMs).then(() => check())
          }
          return cy.wrap(body)
        })
    }

    return check()
  }

  it('submits a simple comfyTest workflow and completes successfully', () => {
    cy.request<ComfyResponse>('POST', `${apiBase}/prompt`, {
      prompt: (comfyTest as any).prompt ?? comfyTest, // support either {prompt:{...}} or full graph
    })
      .its('body')
      .then((body: ComfyResponse) => {
        expect(body.success).to.be.true
        expect(body.promptId, 'promptId returned').to.exist

        const promptId = body.promptId as string
        return pollPromptStatus(promptId).then((finalRes: ComfyResponse) => {
          expect(finalRes.success).to.be.true
          expect(finalRes.status).to.be.oneOf(['done', 'cached'])
        })
      })
  })

  it('submits a fluxKontext workflow and completes successfully', () => {
    cy.request<ComfyResponse>('POST', `${apiBase}/prompt`, {
      prompt: (fluxKontext as any).prompt ?? fluxKontext,
    })
      .its('body')
      .then((body: ComfyResponse) => {
        expect(body.success).to.be.true
        expect(body.promptId, 'promptId returned').to.exist

        const promptId = body.promptId as string
        return pollPromptStatus(promptId).then((finalRes: ComfyResponse) => {
          expect(finalRes.success).to.be.true
          expect(finalRes.status).to.be.oneOf(['done', 'cached'])
        })
      })
  })

  it('handles unknown promptId gracefully', () => {
    cy.request<ComfyResponse>({
      method: 'GET',
      url: `${apiBase}/prompt/does-not-exist`,
      failOnStatusCode: false,
    }).then((res) => {
      const body = res.body as ComfyResponse
      expect(body.success).to.be.false
      expect(body.status).to.be.oneOf(['unknown', 'error'])
    })
  })
})
