import {
  adminHeaders,
  bearerHeaders,
  createLoggedInTestUser,
  getApiEnv,
  jsonHeaders,
} from '../../support/api-auth'

type BotSeedData = {
  dryRun: boolean
  seedCount: number
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  statusCode?: number
}

describe('Bot Seed Command API Tests', () => {
  let seedUrl = ''
  let adminToken = ''
  let userToken = ''

  before(() => {
    return getApiEnv()
      .then((env) => {
        seedUrl = `${env.apiBase}/bots/seed`
        adminToken = env.adminToken
        return createLoggedInTestUser()
      })
      .then((user) => {
        userToken = user.token
      })
  })

  it('rejects bot seeding without authentication', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: seedUrl,
      headers: jsonHeaders(),
      body: { dryRun: true },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
      expect(response.body.data).to.eq(null)
    })
  })

  it('rejects bot seeding from a non-admin user', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: seedUrl,
      headers: bearerHeaders(userToken),
      body: { dryRun: true },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('lets admins inspect the seed command without changing bots', () => {
    cy.request<ApiResponse<BotSeedData>>({
      method: 'POST',
      url: seedUrl,
      headers: adminHeaders(adminToken),
      body: { dryRun: true },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.dryRun).to.eq(true)
      expect(response.body.data?.seedCount).to.be.greaterThan(0)
      expect(response.body.message).to.include('No bots were changed')
    })
  })

  it('rejects unknown bot seed options', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: seedUrl,
      headers: adminHeaders(adminToken),
      body: {
        dryRun: true,
        overwriteEveryBotForever: true,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported bot seed fields')
    })
  })
})
