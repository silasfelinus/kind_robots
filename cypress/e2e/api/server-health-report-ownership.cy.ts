import {
  adminHeaders,
  bearerHeaders,
  createLoggedInTestUser,
  getApiEnv,
  type TestUserAuth,
} from '../../support/api-auth'

type ApiResponse<T = unknown> = {
  success?: boolean
  message?: string
  data?: T
  statusCode?: number
}

type ServerRecord = {
  id: number
  userId: number | null
  title: string
  isPublic: boolean
}

type HealthResult = {
  id: number
  lastStatus: 'ONLINE' | 'OFFLINE'
  ok: boolean
  status: number
  statusText: string
  latencyMs: number
  responseBody: unknown
  runLocation: 'browser'
}

describe('Browser server health report ownership', () => {
  let apiBase = ''
  let adminToken = ''
  let owner: TestUserAuth
  let secondUser: TestUserAuth
  let server: ServerRecord

  before(() => {
    getApiEnv().then((env) => {
      apiBase = env.apiBase
      adminToken = env.adminToken
    })

    createLoggedInTestUser().then((auth) => {
      owner = auth
    })

    createLoggedInTestUser({ role: 'second' }).then((auth) => {
      secondUser = auth
    })

    cy.then(() => {
      const stamp = Date.now()

      return cy.request<ApiResponse<ServerRecord>>({
        method: 'POST',
        url: `${apiBase}/server`,
        headers: adminHeaders(adminToken),
        body: {
          title: `Browser health report ${stamp}`,
          label: 'Health report test',
          description: 'Disposable public server for browser health ownership tests',
          category: 'test',
          serverType: 'CUSTOM',
          accessMode: 'BROWSER',
          authType: 'NONE',
          baseUrl: 'https://example.com',
          endpointPath: '/api',
          healthPath: '/health',
          userId: owner.id,
          isPublic: true,
          isOfficial: false,
          isDefault: false,
          isActive: true,
          isEditable: true,
          isMature: false,
          sortOrder: 999,
        },
        failOnStatusCode: false,
      })
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(owner.id)
      expect(response.body.data?.isPublic).to.eq(true)

      server = response.body.data as ServerRecord

      cy.task(
        'cypressCleanup:register',
        {
          label: `Browser health server ${server.id}`,
          method: 'DELETE',
          url: `${apiBase}/server/${server.id}`,
          headers: adminHeaders(adminToken),
          expectedStatuses: [200, 404],
        },
        { log: false },
      )
    })
  })

  it('rejects an anonymous report for a public server', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/server/health/${server.id}`,
      body: {
        ok: true,
        status: 200,
        statusText: 'OK',
        latencyMs: 12,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects a report from a non-owner', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/server/health/${server.id}`,
      headers: bearerHeaders(secondUser.token),
      body: {
        ok: true,
        status: 200,
        statusText: 'OK',
        latencyMs: 15,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('accepts a valid owner report', () => {
    cy.request<ApiResponse<HealthResult>>({
      method: 'PATCH',
      url: `${apiBase}/server/health/${server.id}`,
      headers: bearerHeaders(owner.token),
      body: {
        ok: true,
        status: 204,
        statusText: 'No Content',
        latencyMs: 37.6,
        responseBody: { healthy: true },
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data).to.include({
        id: server.id,
        lastStatus: 'ONLINE',
        ok: true,
        status: 204,
        statusText: 'No Content',
        latencyMs: 38,
        runLocation: 'browser',
      })
      expect(response.body.data?.responseBody).to.deep.eq({ healthy: true })
    })
  })

  it('rejects unknown report fields', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/server/health/${server.id}`,
      headers: bearerHeaders(owner.token),
      body: {
        ok: true,
        userId: secondUser.id,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/unsupported health report fields/i)
    })
  })

  it('requires a boolean ok value', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/server/health/${server.id}`,
      headers: bearerHeaders(owner.token),
      body: {
        ok: 'yes',
        status: 200,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/ok must be a boolean/i)
    })
  })

  it('rejects out-of-range status and latency values', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/server/health/${server.id}`,
      headers: bearerHeaders(owner.token),
      body: {
        ok: false,
        status: 700,
        latencyMs: 120001,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/status must be an integer/i)
    })
  })

  it('records an owner-reported offline result', () => {
    cy.request<ApiResponse<HealthResult>>({
      method: 'PATCH',
      url: `${apiBase}/server/health/${server.id}`,
      headers: bearerHeaders(owner.token),
      body: {
        ok: false,
        status: 0,
        statusText: 'Browser request failed',
        latencyMs: 100,
        message: 'Connection refused',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.message).to.eq('Connection refused')
      expect(response.body.data).to.include({
        id: server.id,
        lastStatus: 'OFFLINE',
        ok: false,
        status: 0,
        latencyMs: 100,
      })
    })
  })
})
