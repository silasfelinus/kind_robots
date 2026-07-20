import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type ProjectRow = {
  id: number
  userId: number | null
  title: string
  slug: string | null
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  statusCode?: number
}

describe('Project mutation input boundary', () => {
  const stamp = Date.now()

  let apiBase = ''
  let adminToken = ''
  let projectsUrl = ''
  let botsUrl = ''
  let ownerToken = ''
  let otherToken = ''
  let ownerId: number | undefined
  let otherId: number | undefined
  let projectId: number | undefined
  let privateBotId: number | undefined

  const ownerHeaders = () => bearerHeaders(ownerToken)
  const otherHeaders = () => bearerHeaders(otherToken)

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        projectsUrl = `${apiBase}/projects`
        botsUrl = `${apiBase}/bots`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((owner) => {
        ownerToken = owner.token
        ownerId = owner.id
        return createLoggedInTestUser({ role: 'second' })
      })
      .then((other) => {
        otherToken = other.token
        otherId = other.id

        // The other user owns one private Bot.
        return cy
          .request<ApiResponse<ProjectRow>>({
            method: 'POST',
            url: botsUrl,
            headers: otherHeaders(),
            body: { name: `ProjectPrivateBot-${stamp}`, isPublic: false },
          })
          .then((res) => {
            expect(res.status, JSON.stringify(res.body)).to.eq(201)
            privateBotId = res.body.data?.id
            expect(privateBotId).to.be.a('number')
          })
      })
  })

  after(() => {
    if (projectId && ownerToken) {
      cy.request({
        method: 'DELETE',
        url: `${projectsUrl}/${projectId}`,
        headers: ownerHeaders(),
        failOnStatusCode: false,
      }).then(() => {
        projectId = undefined
      })
    }

    if (privateBotId && otherToken) {
      cy.request({
        method: 'DELETE',
        url: `${botsUrl}/${privateBotId}`,
        headers: otherHeaders(),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, ownerId)
    deleteTestUser(apiBase, adminToken, otherId)
  })

  it('creates a Project under the authenticated owner', () => {
    expect(ownerId).to.exist

    cy.request<ApiResponse<ProjectRow>>({
      method: 'POST',
      url: projectsUrl,
      headers: ownerHeaders(),
      body: {
        title: `BoundaryProject-${stamp}`,
        slug: `boundary-project-${stamp}`,
        description: 'A project fixture for the input boundary.',
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(ownerId)

      projectId = response.body.data?.id
      expect(projectId).to.be.a('number')
    })
  })

  it('forbids attaching another user private Bot on Project creation', () => {
    expect(privateBotId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: projectsUrl,
      headers: ownerHeaders(),
      body: {
        title: `PrivateBotProject-${stamp}`,
        slug: `private-bot-project-${stamp}`,
        managerBotId: privateBotId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('permission to attach')
    })
  })

  it('rejects unknown fields on Project creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: projectsUrl,
      headers: ownerHeaders(),
      body: {
        title: `UnknownFieldProject-${stamp}`,
        slug: `unknown-field-project-${stamp}`,
        bogusField: 'nope',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported Project fields')
    })
  })

  it('rejects unknown fields on Project PATCH', () => {
    expect(projectId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${projectsUrl}/${projectId}`,
      headers: ownerHeaders(),
      body: { bogusField: 'nope' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('Unsupported Project fields')
    })
  })

  it('tolerates round-tripped system fields on Project PATCH', () => {
    expect(projectId).to.exist
    expect(ownerId).to.exist

    // A round-tripped Partial<Project> can echo server-owned columns; they are
    // tolerated and never trusted, so the update still succeeds and ownership
    // is unchanged.
    cy.request<ApiResponse<ProjectRow>>({
      method: 'PATCH',
      url: `${projectsUrl}/${projectId}`,
      headers: ownerHeaders(),
      body: {
        goal: 'Ship the boundary.',
        id: projectId,
        userId: ownerId,
        createdAt: new Date().toISOString(),
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(ownerId)
    })
  })
})
