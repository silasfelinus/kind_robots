// /cypress/e2e/api/comfy.cy.ts
/// <reference types="cypress" />

interface ComfyDirectResponse {
  success: boolean
  promptId?: string
  status?: 'done' | 'error' | 'timeout' | 'pending' | 'unknown'
  imageData?: string
  mimeType?: string
  filename?: string
  message?: string
  statusCode?: number
  debug?: unknown
}

describe.skip('Comfy Direct Test Endpoint', () => {
  let apiBase = 'https://kind-robots.vercel.app/api/comfy/test'
  let apiKey = ''
  let serverId = 25
  let fluxCheckpointId = 0
  let sdxlCheckpointId = 0
  let kontextCheckpointId = 0
  let turboCheckpointId = 0

  before(() => {
    cy.env([
      'API_BASE',
      'API_KEY',
      'COMFY_TEST_SERVER_ID',
      'COMFY_FLUX_CHECKPOINT_ID',
      'COMFY_SDXL_CHECKPOINT_ID',
      'COMFY_KONTEXT_CHECKPOINT_ID',
      'COMFY_TURBO_CHECKPOINT_ID',
    ]).then((env) => {
      const rawApiBase = String(
        env.API_BASE || 'https://kind-robots.vercel.app',
      )
      const cleanApiBase = rawApiBase.replace(/\/+$/, '')

      apiBase = `${cleanApiBase}/api/comfy/test`
      apiKey = String(env.API_KEY || '')
      serverId = Number(env.COMFY_TEST_SERVER_ID || 25)
      fluxCheckpointId = Number(env.COMFY_FLUX_CHECKPOINT_ID || 0)
      sdxlCheckpointId = Number(env.COMFY_SDXL_CHECKPOINT_ID || 0)
      kontextCheckpointId = Number(env.COMFY_KONTEXT_CHECKPOINT_ID || 0)
      turboCheckpointId = Number(env.COMFY_TURBO_CHECKPOINT_ID || 0)

      expect(apiKey, 'API_KEY').to.be.a('string').and.not.be.empty
      expect(cleanApiBase, 'API_BASE').to.be.a('string').and.not.be.empty
      expect(serverId, 'COMFY_TEST_SERVER_ID').to.be.greaterThan(0)
    })
  })

  function authHeaders() {
    return {
      Authorization: `Bearer ${apiKey}`,
    }
  }

  function jsonHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    }
  }

  it('reaches Comfy system stats through serverId without checkpoint', () => {
    cy.request({
      method: 'GET',
      url: `${apiBase}/info`,
      qs: {
        serverId,
        target: 'system',
      },
      headers: authHeaders(),
      failOnStatusCode: false,
      timeout: 30000,
    }).then((res) => {
      expect(res.body.success, JSON.stringify(res.body)).to.eq(true)
      expect(res.body.data, JSON.stringify(res.body)).to.exist
    })
  })

  it('reaches Comfy queue through serverId without checkpoint', () => {
    cy.request({
      method: 'GET',
      url: `${apiBase}/info`,
      qs: {
        serverId,
        target: 'queue',
      },
      headers: authHeaders(),
      failOnStatusCode: false,
      timeout: 30000,
    }).then((res) => {
      expect(res.body.success, JSON.stringify(res.body)).to.eq(true)
      expect(res.body.data, JSON.stringify(res.body)).to.exist
    })
  })

  it('validates Flux checkpoint is attached to the Comfy server', () => {
    expect(fluxCheckpointId, 'COMFY_FLUX_CHECKPOINT_ID').to.be.greaterThan(0)

    cy.request({
      method: 'GET',
      url: `${apiBase}/info`,
      qs: {
        serverId,
        checkpointId: fluxCheckpointId,
        target: 'queue',
      },
      headers: authHeaders(),
      failOnStatusCode: false,
      timeout: 30000,
    }).then((res) => {
      expect(res.body.success, JSON.stringify(res.body)).to.eq(true)
      expect(res.body.checkpointId, JSON.stringify(res.body)).to.eq(
        fluxCheckpointId,
      )
    })
  })

  it('generates one Flux image and returns imageData', () => {
    expect(fluxCheckpointId, 'COMFY_FLUX_CHECKPOINT_ID').to.be.greaterThan(0)

    cy.request<ComfyDirectResponse>({
      method: 'POST',
      url: `${apiBase}/generate`,
      headers: jsonHeaders(),
      body: {
        serverId,
        checkpointId: fluxCheckpointId,
        prompt:
          'candid sci-fi photograph at an exotic alien public hot spring on a venusian moon, elaborate swirling sky, magical bubbles reflecting a beautiful galaxy in space, plum and rainbow braided hair streaks, alien jellyfish people relaxing in the background',
        width: 512,
        height: 512,
        steps: 8,
        cfg: 8,
        timeoutMs: 180000,
      },
      failOnStatusCode: false,
      timeout: 240000,
    }).then((res) => {
      const body = res.body

      cy.log(
        'Comfy direct generate response:',
        JSON.stringify({
          ...body,
          imageData: body.imageData
            ? `${body.imageData.slice(0, 80)}...`
            : null,
        }),
      )

      expect(body.success, JSON.stringify(body)).to.eq(true)
      expect(body.status).to.eq('done')
      expect(body.promptId, JSON.stringify(body)).to.be.a('string').and.not.be
        .empty
      expect(body.imageData, JSON.stringify(body))
        .to.be.a('string')
        .and.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,/)
    })
  })

  it('handles missing prompt gracefully', () => {
    expect(fluxCheckpointId, 'COMFY_FLUX_CHECKPOINT_ID').to.be.greaterThan(0)

    cy.request<ComfyDirectResponse>({
      method: 'POST',
      url: `${apiBase}/generate`,
      headers: jsonHeaders(),
      body: {
        serverId,
        checkpointId: fluxCheckpointId,
      },
      failOnStatusCode: false,
      timeout: 30000,
    }).then((res) => {
      const body = res.body

      expect(body.success, JSON.stringify(body)).to.eq(false)
      expect(body.statusCode, JSON.stringify(body)).to.eq(400)
    })
  })

  it('handles missing checkpointId gracefully', () => {
    cy.request<ComfyDirectResponse>({
      method: 'POST',
      url: `${apiBase}/generate`,
      headers: jsonHeaders(),
      body: {
        serverId,
        prompt: 'simple test image of a robot holding a wrench',
      },
      failOnStatusCode: false,
      timeout: 30000,
    }).then((res) => {
      expect(res.status).to.eq(400)
    })
  })
})
