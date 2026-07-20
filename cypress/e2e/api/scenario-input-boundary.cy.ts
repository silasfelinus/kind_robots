import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

type ScenarioRow = {
  id: number
  title: string
  userId: number
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  statusCode?: number
}

describe('Scenario mutation input boundary', () => {
  const stamp = Date.now()
  let apiBase = ''
  let adminToken = ''
  let userId: number | undefined
  let userToken = ''
  let scenarioId: number | undefined

  const scenariosUrl = () => `${apiBase}/scenarios`
  const headers = () => bearerHeaders(userToken)

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        return createLoggedInTestUser({ fresh: true })
      })
      .then((user) => {
        userId = user.id
        userToken = user.token
      })
  })

  after(() => {
    if (scenarioId) {
      cy.request({
        method: 'DELETE',
        url: `${scenariosUrl()}/${scenarioId}`,
        headers: headers(),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, userId)
  })

  it('rejects unknown and spoofed fields on singular Scenario creation', () => {
    expect(userId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse>({
      method: 'POST',
      url: scenariosUrl(),
      headers: headers(),
      body: {
        title: `Unknown Scenario Field ${stamp}`,
        serverId: 1,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported Scenario fields')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: scenariosUrl(),
      headers: headers(),
      body: {
        title: `Spoofed Scenario Owner ${stamp}`,
        userId: (userId ?? 0) + 1_000_000,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Ownership is server-owned')
    })
  })

  it('rejects malformed enums, booleans, and relation arrays', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: scenariosUrl(),
      headers: headers(),
      body: {
        title: `Invalid Scenario Enum ${stamp}`,
        outputType: 'BANANA',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('outputType')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: scenariosUrl(),
      headers: headers(),
      body: {
        title: `Invalid Scenario Boolean ${stamp}`,
        isPublic: 'yes',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('isPublic')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: scenariosUrl(),
      headers: headers(),
      body: {
        title: `Oversized Scenario Relations ${stamp}`,
        dreamIds: Array.from({ length: 101 }, (_, index) => index + 1),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('at most 100 entries')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: scenariosUrl(),
      headers: headers(),
      body: {
        title: `Invalid Scenario Relations ${stamp}`,
        characterIds: [1, 0],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('invalid ID at index 1')
    })
  })

  it('keeps singular ScenarioStore compatibility explicit and auth-bound', () => {
    expect(userId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse<ScenarioRow>>({
      method: 'POST',
      url: scenariosUrl(),
      headers: headers(),
      body: {
        id: -1,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: `Scenario Boundary Control ${stamp}`,
        outputType: 'STORY',
        intros: ['A strict but compatible opening.'],
        dreamIds: [],
        characterIds: [],
        facetIds: [],
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(userId)
      scenarioId = response.body.data?.id
      expect(scenarioId).to.be.a('number').and.greaterThan(0)
    })
  })

  it('rejects unknown, mismatched ID, and oversized PATCH fields', () => {
    expect(scenarioId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${scenariosUrl()}/${scenarioId}`,
      headers: headers(),
      body: { serverId: 1 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('Unsupported Scenario fields')
    })

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${scenariosUrl()}/${scenarioId}`,
      headers: headers(),
      body: {
        id: (scenarioId ?? 0) + 1,
        title: `Wrong Route Scenario ${stamp}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('must match the route')
    })

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${scenariosUrl()}/${scenarioId}`,
      headers: headers(),
      body: {
        facetIds: Array.from({ length: 101 }, (_, index) => index + 1),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('at most 100 entries')
    })
  })

  it('keeps Scenario batch create and patch imports strict and bounded', () => {
    expect(userId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse>({
      method: 'POST',
      url: `${scenariosUrl()}/batch`,
      headers: headers(),
      body: [
        {
          title: `Batch Scenario Identity ${stamp}`,
          userId,
        },
      ],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.data?.failed?.[0]?.message).to.include(
        'Unsupported Scenario fields',
      )
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: `${scenariosUrl()}/batch`,
      headers: headers(),
      body: Array.from({ length: 101 }, (_, index) => ({
        title: `Oversized Scenario Batch ${stamp}-${index}`,
      })),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('at most 100 entries')
    })

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${scenariosUrl()}/batch`,
      headers: headers(),
      body: {
        updates: Array.from({ length: 101 }, (_, index) => ({
          id: index + 1,
          title: `Oversized Scenario Patch ${stamp}-${index}`,
        })),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('at most 100 entries')
    })
  })
})
