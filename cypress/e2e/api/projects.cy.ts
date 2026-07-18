// /cypress/e2e/api/projects.cy.ts
import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

const expectLeanProject = (project: Record<string, unknown>) => {
  expect(project).to.not.have.property('Manager')
  expect(project).to.not.have.property('ArtImage')
  expect(project).to.not.have.property('ArtCollection')
  expect(project).to.not.have.property('PitchSheet')
  expect(project).to.not.have.property('_count')
}

describe('Project API', () => {
  const stamp = Date.now()
  const slug = `cypress-project-${stamp}`

  let apiBase = ''
  let baseUrl = ''
  let adminToken = ''
  let token = ''
  let userId = 0
  let projectId = 0

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        baseUrl = `${apiBase}/projects`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        token = auth.token
        userId = auth.id
      })
  })

  after(() => {
    deleteTestUser(apiBase, adminToken, userId)
  })

  it('creates a first-class Project with a lean mutation response', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(token),
      body: {
        title: `Cypress Project ${stamp}`,
        slug,
        conductorSlug: slug,
        description: 'Created by the Project API cutover test.',
        flavorText: 'Project rows are real now.',
        status: 'ACTIVE',
        priority: 'HIGH',
        channelKey: 'plan',
        tabKey: 'projects',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data.slug).to.eq(slug)
      expect(response.body.data.status).to.eq('ACTIVE')
      expect(response.body.data.priority).to.eq('HIGH')
      expect(response.body.data.channelKey).to.eq('plan')
      expect(response.body.data.tabKey).to.eq('projects')
      expectLeanProject(response.body.data)
      projectId = response.body.data.id
    })
  })

  it('retrieves the same Project detail by slug', () => {
    cy.request({
      url: `${baseUrl}/${slug}`,
      headers: bearerHeaders(token),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data.id).to.eq(projectId)
      expect(response.body.data.conductorSlug).to.eq(slug)
      expect(response.body.data).to.have.property('Manager')
      expect(response.body.data).to.have.property('ArtImage')
      expect(response.body.data).to.have.property('ArtCollection')
      expect(response.body.data).to.have.property('PitchSheet')
      expect(response.body.data).to.have.property('_count')
    })
  })

  it('lists the authenticated user Projects', () => {
    cy.request({
      url: `${baseUrl}?mine=true&includeInactive=true`,
      headers: bearerHeaders(token),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data).to.be.an('array')
      expect(
        response.body.data.some(
          (project: { id: number }) => project.id === projectId,
        ),
      ).to.be.true
    })
  })

  it('updates placement fields with a lean mutation response', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${projectId}`,
      headers: bearerHeaders(token),
      body: {
        priority: 'LOW',
        channelKey: 'lab',
        tabKey: 'challenges',
        liveUrl: '/challenges',
        allowReviews: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data.priority).to.eq('LOW')
      expect(response.body.data.channelKey).to.eq('lab')
      expect(response.body.data.tabKey).to.eq('challenges')
      expect(response.body.data.allowReviews).to.be.true
      expectLeanProject(response.body.data)
    })
  })

  it('archives instead of destructively deleting the Project', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${projectId}`,
      headers: bearerHeaders(token),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data.isActive).to.be.false
      expect(response.body.data.status).to.eq('ARCHIVED')
    })
  })
})
