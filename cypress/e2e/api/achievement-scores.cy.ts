import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  invalidBearerHeaders,
  jsonHeaders,
} from '../../support/api-auth'

type ScoreResult = {
  userId: number
  newScore: number
  previousScore: number
  improved: boolean
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  statusCode?: number
}

describe('Achievement Score Ownership API Tests', () => {
  let apiBase = ''
  let adminToken = ''
  let clickUrl = ''
  let matchUrl = ''
  let ownerToken = ''
  let otherToken = ''
  let ownerId: number | undefined
  let otherId: number | undefined

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        clickUrl = `${apiBase}/achievements/updateClickRecord`
        matchUrl = `${apiBase}/achievements/updateMatchRecord`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((owner) => {
        ownerToken = owner.token
        ownerId = owner.id
        return createLoggedInTestUser({ fresh: true })
      })
      .then((other) => {
        otherToken = other.token
        otherId = other.id
      })
  })

  after(() => {
    deleteTestUser(apiBase, adminToken, ownerId)
    deleteTestUser(apiBase, adminToken, otherId)
  })

  it('rejects click score updates without authentication', () => {
    cy.request<ApiResponse>({
      method: 'PUT',
      url: clickUrl,
      headers: jsonHeaders(),
      body: { newScore: 10 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
      expect(response.body.data).to.eq(null)
    })
  })

  it('rejects match score updates with an invalid token', () => {
    cy.request<ApiResponse>({
      method: 'PUT',
      url: matchUrl,
      headers: invalidBearerHeaders(),
      body: { newScore: 10 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects caller-supplied user identity', () => {
    expect(otherId).to.exist

    cy.request<ApiResponse>({
      method: 'PUT',
      url: clickUrl,
      headers: bearerHeaders(ownerToken),
      body: {
        newScore: 123,
        userId: otherId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('User identity comes from authentication')
    })
  })

  it('updates only the authenticated user click high score', () => {
    expect(ownerId).to.exist

    cy.request<ApiResponse<ScoreResult>>({
      method: 'PUT',
      url: clickUrl,
      headers: bearerHeaders(ownerToken),
      body: { newScore: 123 },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(ownerId)
      expect(response.body.data?.newScore).to.eq(123)
      expect(response.body.data?.improved).to.eq(true)
    })
  })

  it('does not lower an existing click high score', () => {
    cy.request<ApiResponse<ScoreResult>>({
      method: 'PUT',
      url: clickUrl,
      headers: bearerHeaders(ownerToken),
      body: { newScore: 12 },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.previousScore).to.eq(123)
      expect(response.body.data?.newScore).to.eq(123)
      expect(response.body.data?.improved).to.eq(false)
    })
  })

  it('keeps another user match score isolated', () => {
    expect(otherId).to.exist

    cy.request<ApiResponse<ScoreResult>>({
      method: 'PUT',
      url: matchUrl,
      headers: bearerHeaders(otherToken),
      body: { newScore: 77 },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(otherId)
      expect(response.body.data?.newScore).to.eq(77)
      expect(response.body.data?.improved).to.eq(true)
    })
  })

  it('rejects negative and non-integer scores', () => {
    for (const newScore of [-1, 1.5, '9001']) {
      cy.request<ApiResponse>({
        method: 'PUT',
        url: matchUrl,
        headers: bearerHeaders(ownerToken),
        body: { newScore },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.success).to.eq(false)
        expect(response.body.message).to.include('non-negative safe integer')
      })
    }
  })
})
