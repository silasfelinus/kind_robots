import {
  adminHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

type ApiResponse = {
  success: boolean
  message: string
}

describe('Prompt ownership boundary', () => {
  let apiBase = ''
  let adminToken = ''
  let targetUserId: number | undefined

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
    deleteTestUser(apiBase, adminToken, targetUserId)
  })

  it('does not let elevated credentials assign Prompt ownership', () => {
    expect(targetUserId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/prompts`,
      headers: adminHeaders(adminToken),
      body: {
        prompt: `Cypress elevated ownership spoof ${Date.now()}`,
        userId: targetUserId,
        creationSource: 'HUMAN',
        isPublic: false,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Ownership is server-owned')
    })
  })
})
