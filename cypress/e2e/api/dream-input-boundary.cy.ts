import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

type DreamRow = {
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

describe('Dream mutation input boundary', () => {
  const stamp = Date.now()
  let apiBase = ''
  let adminToken = ''
  let userId: number | undefined
  let userToken = ''
  let dreamId: number | undefined

  const dreamsUrl = () => `${apiBase}/dreams`
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
    if (dreamId) {
      cy.request({
        method: 'DELETE',
        url: `${dreamsUrl()}/${dreamId}`,
        headers: headers(),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, userId)
  })

  it('rejects unknown and spoofed fields on singular Dream creation', () => {
    expect(userId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl(),
      headers: headers(),
      body: {
        title: `Unknown Field Dream ${stamp}`,
        createdAt: new Date().toISOString(),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported Dream fields')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl(),
      headers: headers(),
      body: {
        title: `Spoofed Owner Dream ${stamp}`,
        userId: (userId ?? 0) + 1_000_000,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Ownership is server-owned')
    })
  })

  it('rejects oversized and invalid relation arrays on Dream creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl(),
      headers: headers(),
      body: {
        title: `Oversized Relations Dream ${stamp}`,
        characterIds: Array.from({ length: 101 }, (_, index) => index + 1),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('at most 100 entries')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl(),
      headers: headers(),
      body: {
        title: `Invalid Relations Dream ${stamp}`,
        rewardIds: [1, 0],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('invalid ID at index 1')
    })
  })

  it('keeps the current matching-owner store compatibility fields explicit', () => {
    expect(userId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse<DreamRow>>({
      method: 'POST',
      url: dreamsUrl(),
      headers: headers(),
      body: {
        title: `Dream Input Boundary Control ${stamp}`,
        dreamType: 'PITCH',
        creationSource: 'HUMAN',
        userId,
        tagIds: [],
        promptIds: [],
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(userId)
      dreamId = response.body.data?.id
      expect(dreamId).to.be.a('number').and.greaterThan(0)
    })
  })

  it('rejects unknown, mismatched ID, and oversized relation fields on PATCH', () => {
    expect(dreamId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${dreamsUrl()}/${dreamId}`,
      headers: headers(),
      body: {
        createdAt: new Date().toISOString(),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported Dream fields')
    })

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${dreamsUrl()}/${dreamId}`,
      headers: headers(),
      body: {
        id: (dreamId ?? 0) + 1,
        title: `Wrong Route Dream ${stamp}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('must match the route')
    })

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${dreamsUrl()}/${dreamId}`,
      headers: headers(),
      body: {
        rewardIds: Array.from({ length: 101 }, (_, index) => index + 1),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('at most 100 entries')
    })
  })

  it('applies the same strict boundary to Dream batches', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${dreamsUrl()}/batch`,
      headers: headers(),
      body: {
        dreams: [{ title: `Batch Unknown Field Dream ${stamp}` }],
        userId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported Dream batch fields')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: `${dreamsUrl()}/batch`,
      headers: headers(),
      body: [
        {
          title: `Batch Spoofed Owner Dream ${stamp}`,
          userId,
        },
      ],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported Dream fields')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: `${dreamsUrl()}/batch`,
      headers: headers(),
      body: Array.from({ length: 101 }, (_, index) => ({
        title: `Oversized Dream Batch ${stamp}-${index}`,
      })),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('at most 100 entries')
    })
  })
})
