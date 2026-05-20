// /cypress/e2e/api/comfy-direct.cy.ts
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

describe('Comfy Direct Test Endpoint', () => {
  let apiBase = 'https://kind-robots.vercel.app/api/comfy/test'
  let apiKey = ''
  let comfyApiUrl = 'https://comfy-api.acrocatranch.com'

  before(() => {
    cy.env(['API_BASE', 'API_KEY', 'COMFY_API_URL']).then((env) => {
      const rawApiBase = String(
        env.API_BASE || 'https://kind-robots.vercel.app',
      )
      const cleanApiBase = rawApiBase.replace(/\/+$/, '')

      apiBase = `${cleanApiBase}/api/comfy/test`
      apiKey = String(env.API_KEY || '')
      comfyApiUrl = String(
        env.COMFY_API_URL || 'https://comfy-api.acrocatranch.com',
      ).replace(/\/+$/, '')

      expect(apiKey, 'API_KEY').to.be.a('string').and.not.be.empty
      expect(cleanApiBase, 'API_BASE').to.be.a('string').and.not.be.empty
      expect(comfyApiUrl, 'COMFY_API_URL').to.be.a('string').and.not.be.empty
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

  it('reaches Comfy system stats', () => {
    cy.request({
      method: 'GET',
      url: `${apiBase}/info`,
      qs: {
        apiUrl: comfyApiUrl,
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

  it('reaches Comfy queue', () => {
    cy.request({
      method: 'GET',
      url: `${apiBase}/info`,
      qs: {
        apiUrl: comfyApiUrl,
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

  it('generates one image and returns imageData', () => {
    cy.request<ComfyDirectResponse>({
      method: 'POST',
      url: `${apiBase}/generate`,
      headers: jsonHeaders(),
      body: {
        apiUrl: comfyApiUrl,
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
    cy.request<ComfyDirectResponse>({
      method: 'POST',
      url: `${apiBase}/generate`,
      headers: jsonHeaders(),
      body: {
        apiUrl: comfyApiUrl,
      },
      failOnStatusCode: false,
      timeout: 30000,
    }).then((res) => {
      const body = res.body

      expect(body.success, JSON.stringify(body)).to.eq(false)
      expect(body.statusCode, JSON.stringify(body)).to.eq(400)
    })
  })
})
