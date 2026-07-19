import {
  adminHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

type ServerRecord = {
  id: number
  title: string
  userId?: number | null
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  skipped?: string[]
}

describe('Server ownership boundary', () => {
  const stamp = Date.now()
  let apiBase = ''
  let adminToken = ''
  let targetUserId: number | undefined
  let createdServerId: number | undefined

  const serverUrl = () => `${apiBase}/server`

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        return createLoggedInTestUser({ role: 'second' })
      })
      .then((user) => {
        targetUserId = user.id
      })
  })

  after(() => {
    if (createdServerId) {
      cy.request({
        method: 'DELETE',
        url: `${serverUrl()}/${createdServerId}`,
        headers: adminHeaders(adminToken),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, targetUserId)
  })

  it('does not let elevated credentials assign Server ownership on create', () => {
    expect(targetUserId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse>({
      method: 'POST',
      url: serverUrl(),
      headers: adminHeaders(adminToken),
      body: {
        title: `Cypress Server Ownership Spoof ${stamp}`,
        baseUrl: 'https://example.com',
        userId: targetUserId,
        isPublic: false,
        isOfficial: false,
        isDefault: false,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Ownership is server-owned')
    })
  })

  it('does not let elevated credentials assign Server ownership in batches', () => {
    expect(targetUserId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse<ServerRecord[]>>({
      method: 'POST',
      url: `${serverUrl()}/batch`,
      headers: adminHeaders(adminToken),
      body: [
        {
          title: `Cypress Batch Server Ownership Spoof ${stamp}`,
          baseUrl: 'https://example.com',
          userId: targetUserId,
          isPublic: false,
          isOfficial: false,
          isDefault: false,
        },
      ],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.data).to.deep.eq([])
      expect(response.body.skipped?.[0]).to.include('Ownership is server-owned')
    })
  })

  it('does not let elevated credentials reassign Server ownership', () => {
    expect(targetUserId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse<ServerRecord>>({
      method: 'POST',
      url: serverUrl(),
      headers: adminHeaders(adminToken),
      body: {
        title: `Cypress Server Ownership Control ${stamp}`,
        baseUrl: 'https://example.com',
        isPublic: false,
        isOfficial: false,
        isDefault: false,
        isActive: true,
        isEditable: true,
      },
    }).then((createResponse) => {
      expect(createResponse.status, JSON.stringify(createResponse.body)).to.eq(
        201,
      )
      createdServerId = createResponse.body.data?.id
      expect(createdServerId).to.be.a('number').and.greaterThan(0)

      cy.request<ApiResponse>({
        method: 'PATCH',
        url: `${serverUrl()}/${createdServerId}`,
        headers: adminHeaders(adminToken),
        body: {
          userId: targetUserId,
        },
        failOnStatusCode: false,
      }).then((patchResponse) => {
        expect(patchResponse.status).to.eq(400)
        expect(patchResponse.body.success).to.eq(false)
        expect(patchResponse.body.message).to.include(
          'Ownership is server-owned',
        )
      })
    })
  })
})
