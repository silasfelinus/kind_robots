import {
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

type LogRecord = {
  id: number
  message: string
  timestamp: string
  username: string | null
  userId: number | null
}

type LogList = {
  logs: LogRecord[]
  count: number
}

describe('Log ownership API', () => {
  let apiBase = ''
  let owner: TestUserAuth
  let secondUser: TestUserAuth
  let ownerLog: LogRecord
  let secondLog: LogRecord

  before(() => {
    getApiEnv().then((env) => {
      apiBase = env.apiBase
    })

    createLoggedInTestUser().then((auth) => {
      owner = auth
    })

    createLoggedInTestUser({ role: 'second' }).then((auth) => {
      secondUser = auth
    })

    cy.then(() =>
      cy.request<ApiResponse<LogRecord>>({
        method: 'POST',
        url: `${apiBase}/logs`,
        headers: bearerHeaders(owner.token),
        body: { message: `owner-log-${Date.now()}` },
        failOnStatusCode: false,
      }),
    ).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(owner.id)
      expect(response.body.data?.username).to.eq(owner.username)
      ownerLog = response.body.data as LogRecord

      cy.task(
        'cypressCleanup:register',
        {
          label: `Owner log ${ownerLog.id}`,
          method: 'DELETE',
          url: `${apiBase}/logs/${ownerLog.id}`,
          headers: bearerHeaders(owner.token),
          expectedStatuses: [200, 404],
        },
        { log: false },
      )
    })

    cy.then(() =>
      cy.request<ApiResponse<LogRecord>>({
        method: 'POST',
        url: `${apiBase}/logs`,
        headers: bearerHeaders(secondUser.token),
        body: { message: `second-log-${Date.now()}` },
        failOnStatusCode: false,
      }),
    ).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.data?.userId).to.eq(secondUser.id)
      secondLog = response.body.data as LogRecord

      cy.task(
        'cypressCleanup:register',
        {
          label: `Second log ${secondLog.id}`,
          method: 'DELETE',
          url: `${apiBase}/logs/${secondLog.id}`,
          headers: bearerHeaders(secondUser.token),
          expectedStatuses: [200, 404],
        },
        { log: false },
      )
    })
  })

  it('requires authentication for log creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/logs`,
      body: { message: 'anonymous' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
      expect(response.body.statusCode).to.eq(401)
    })
  })

  it('rejects caller-supplied identity and timestamps', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/logs`,
      headers: bearerHeaders(owner.token),
      body: {
        message: 'forged log',
        userId: secondUser.id,
        username: secondUser.username,
        timestamp: '2000-01-01T00:00:00.000Z',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/unsupported log fields/i)
    })
  })

  it('returns only the authenticated user’s logs', () => {
    cy.request<ApiResponse<LogList>>({
      method: 'GET',
      url: `${apiBase}/logs?take=100&skip=0`,
      headers: bearerHeaders(owner.token),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.logs.some((log) => log.id === ownerLog.id)).to.eq(
        true,
      )
      expect(response.body.data?.logs.some((log) => log.id === secondLog.id)).to.eq(
        false,
      )
      expect(
        response.body.data?.logs.every((log) => log.userId === owner.id),
      ).to.eq(true)
    })
  })

  it('prevents ordinary users from filtering by another identity', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${apiBase}/logs?userId=${secondUser.id}`,
      headers: bearerHeaders(owner.token),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('prevents cross-user log reads', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${apiBase}/logs/${ownerLog.id}`,
      headers: bearerHeaders(secondUser.token),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
      expect(response.body.statusCode).to.eq(403)
    })
  })

  it('allows an owner to read their log', () => {
    cy.request<ApiResponse<LogRecord>>({
      method: 'GET',
      url: `${apiBase}/logs/${ownerLog.id}`,
      headers: bearerHeaders(owner.token),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.id).to.eq(ownerLog.id)
      expect(response.body.data?.userId).to.eq(owner.id)
    })
  })

  it('prevents cross-user deletion', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${apiBase}/logs/${ownerLog.id}`,
      headers: bearerHeaders(secondUser.token),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('returns real HTTP status codes for invalid and missing IDs', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${apiBase}/logs/0`,
      headers: bearerHeaders(owner.token),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.statusCode).to.eq(400)
    })

    cy.request<ApiResponse>({
      method: 'GET',
      url: `${apiBase}/logs/2147483647`,
      headers: bearerHeaders(owner.token),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(404)
      expect(response.body.statusCode).to.eq(404)
    })
  })

  it('allows an owner to delete their log', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${apiBase}/logs/${ownerLog.id}`,
      headers: bearerHeaders(owner.token),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data).to.eq(null)
      ownerLog.id = 0
    })
  })
})
