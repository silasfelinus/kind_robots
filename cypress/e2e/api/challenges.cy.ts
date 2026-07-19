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

type Challenge = {
  id: number
  createdAt: string
  updatedAt: string | null
  slug: string
  title: string
  challengeType: string
  difficulty: number
  promptText: string
  judgeNotes: string | null
  status: string
  isMature: boolean
  userId: number | null
  User?: unknown
  Submissions?: unknown
}

describe('Challenge mutation ownership', () => {
  let apiBase = ''
  let adminToken = ''
  let ordinaryUser: TestUserAuth
  let challenge: Challenge
  const stamp = `${Date.now()}-${Cypress._.random(1000, 9999)}`
  const slug = `cypress-challenge-${stamp}`

  const challengeBody = {
    slug,
    title: `Cypress Challenge ${stamp}`,
    challengeType: 'TEXT',
    difficulty: 3,
    promptText: 'Write a tiny robot fable with an honest ending.',
    judgeNotes: 'Prefer clarity over ornamental fog.',
    status: 'OPEN',
    isMature: false,
  }

  before(() => {
    getApiEnv().then((env) => {
      apiBase = env.apiBase
      adminToken = env.adminToken
    })

    createLoggedInTestUser({ role: 'second' }).then((auth) => {
      ordinaryUser = auth
    })
  })

  it('denies anonymous creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/challenges`,
      body: challengeBody,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
      expect(response.body.statusCode).to.eq(401)
    })
  })

  it('denies non-admin creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/challenges`,
      headers: bearerHeaders(ordinaryUser.token),
      body: challengeBody,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
      expect(response.body.statusCode).to.eq(403)
    })
  })

  it('rejects caller-supplied identity and server-owned fields', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/challenges`,
      headers: adminHeaders(adminToken),
      body: {
        ...challengeBody,
        userId: ordinaryUser.id,
        createdAt: new Date().toISOString(),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/unsupported challenge fields/i)
      expect(response.body.message || '').to.match(/userId/i)
      expect(response.body.message || '').to.match(/createdAt/i)
    })
  })

  it('lets an admin create a lean Challenge owned by authentication', () => {
    cy.request<ApiResponse<Challenge>>({
      method: 'POST',
      url: `${apiBase}/challenges`,
      headers: adminHeaders(adminToken),
      body: challengeBody,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.statusCode).to.eq(201)
      expect(response.body.data?.slug).to.eq(slug)
      expect(response.body.data?.userId).to.be.a('number').and.be.greaterThan(0)
      expect(response.body.data?.userId).not.to.eq(ordinaryUser.id)
      expect(response.body.data).not.to.have.property('User')
      expect(response.body.data).not.to.have.property('Submissions')
      challenge = response.body.data as Challenge

      cy.task(
        'cypressCleanup:register',
        {
          label: `Challenge ${challenge.id}`,
          method: 'DELETE',
          url: `${apiBase}/challenges/${challenge.slug}`,
          headers: adminHeaders(adminToken),
          expectedStatuses: [200, 404],
        },
        { log: false },
      )
    })
  })

  it('returns 409 for a duplicate slug', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/challenges`,
      headers: adminHeaders(adminToken),
      body: challengeBody,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.eq(false)
      expect(response.body.statusCode).to.eq(409)
    })
  })

  it('denies anonymous deletion', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${apiBase}/challenges/${challenge.slug}`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('denies non-admin deletion', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${apiBase}/challenges/${challenge.slug}`,
      headers: bearerHeaders(ordinaryUser.token),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('lets an admin delete the Challenge without manual relationship cleanup', () => {
    cy.request<ApiResponse<Challenge>>({
      method: 'DELETE',
      url: `${apiBase}/challenges/${challenge.slug}`,
      headers: adminHeaders(adminToken),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.id).to.eq(challenge.id)
      expect(response.body.data).not.to.have.property('User')
      expect(response.body.data).not.to.have.property('Submissions')
    })
  })
})
