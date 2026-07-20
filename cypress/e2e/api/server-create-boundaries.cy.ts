/// <reference types="cypress" />

import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  type TestUserAuth,
} from '../../support/api-auth'

type ServerRow = {
  id: number
  title: string
  serverType: string
  apiKey: string | null
  hasApiKey: boolean
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  skipped?: string[]
  statusCode?: number
}

describe('Server create boundaries', () => {
  let apiBase = ''
  let adminToken = ''
  let user: TestUserAuth | undefined
  const createdIds: number[] = []
  const stamp = Date.now()

  const baseUrl = () => `${apiBase}/server`
  const headers = () => bearerHeaders(user!.token)

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        user = auth
      })
  })

  after(() => {
    for (const id of createdIds) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl()}/${id}`,
        headers: headers(),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, user?.id)
  })

  it('rejects arrays on single-resource Server POST', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl(),
      headers: headers(),
      body: [
        {
          title: `Wrong Route ${stamp}`,
          serverType: 'OLLAMA',
          baseUrl: 'http://127.0.0.1:11434',
        },
      ],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('/api/server/batch')
    })
  })

  it('rejects unknown fields on Server creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl(),
      headers: headers(),
      body: {
        title: `Unknown Field Server ${stamp}`,
        serverType: 'OLLAMA',
        baseUrl: 'http://127.0.0.1:11434',
        bogusField: 'nope',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported Server fields')
    })
  })

  it('creates and updates an OLLAMA server with a masked API key', () => {
    cy.request<ApiResponse<ServerRow>>({
      method: 'POST',
      url: baseUrl(),
      headers: headers(),
      body: {
        title: `Ollama Boundary ${stamp}`,
        serverType: 'OLLAMA',
        accessMode: 'LOCAL',
        authType: 'BEARER',
        baseUrl: 'http://127.0.0.1:11434',
        endpointPath: '/api/chat',
        healthPath: '/api/tags',
        apiKey: 'cypress-secret',
        isPublic: false,
      },
    })
      .then((response) => {
        expect(response.status, JSON.stringify(response.body)).to.eq(201)
        expect(response.body.success).to.eq(true)
        expect(response.body.data?.serverType).to.eq('OLLAMA')
        expect(response.body.data?.apiKey).to.eq('••••••••')
        expect(response.body.data?.hasApiKey).to.eq(true)

        createdIds.push(response.body.data!.id)

        return cy.request<ApiResponse<ServerRow>>({
          method: 'PATCH',
          url: `${baseUrl()}/${response.body.data!.id}`,
          headers: headers(),
          body: {
            serverType: 'OLLAMA',
            model: 'llama3.2',
          },
        })
      })
      .then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.success).to.eq(true)
        expect(response.body.data?.serverType).to.eq('OLLAMA')
        expect(response.body.data?.apiKey).to.eq('••••••••')
        expect(response.body.data?.hasApiKey).to.eq(true)
      })
  })

  it('batch-creates valid servers and reports invalid enum rows', () => {
    cy.request<ApiResponse<ServerRow[]>>({
      method: 'POST',
      url: `${baseUrl()}/batch`,
      headers: headers(),
      body: [
        {
          title: `Batch Ollama ${stamp}`,
          serverType: 'OLLAMA',
          accessMode: 'LOCAL',
          authType: 'NONE',
          baseUrl: 'http://127.0.0.1:11435',
        },
        {
          title: `Invalid Server ${stamp}`,
          serverType: 'BANANA',
          baseUrl: 'https://example.com',
        },
      ],
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(207)
      expect(response.body.success).to.eq(true)
      expect(response.body.data).to.have.length(1)
      expect(response.body.data?.[0].serverType).to.eq('OLLAMA')
      expect(response.body.skipped).to.have.length(1)
      expect(response.body.skipped?.[0]).to.include('Invalid serverType')

      createdIds.push(response.body.data![0].id)
    })
  })
})
