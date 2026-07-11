// /cypress/e2e/api/project-write-boundary.cy.ts
import { createLoggedInTestUser } from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Project write boundary', () => {
  const apiBase = 'https://kind-robots.vercel.app/api'
  const stamp = Date.now()
  const slug = `cypress-project-boundary-${stamp}`
  let token = ''
  let projectId = 0

  before(() => {
    createLoggedInTestUser().then((auth) => {
      token = auth.token
    })
  })

  it('rejects Project creation through the single Dream endpoint', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/dreams`,
      failOnStatusCode: false,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: `Wrong Project Route ${stamp}`,
        slug: `${slug}-single`,
        dreamType: 'PROJECT',
        description: 'This must not create a Project-shaped Dream.',
      },
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.be.false
      expect(response.body.data).to.eq(null)
      expect(response.body.message).to.contain('/api/projects')
    })
  })

  it('rejects Project creation through the Dream batch endpoint', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/dreams/batch`,
      failOnStatusCode: false,
      headers: { Authorization: `Bearer ${token}` },
      body: [
        {
          title: `Wrong Batch Project Route ${stamp}`,
          slug: `${slug}-batch`,
          dreamType: 'PROJECT',
          description: 'Batch imports must use the Project API too.',
        },
      ],
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.be.false
      expect(response.body.count).to.eq(0)
      expect(response.body.errors).to.have.length(1)
      expect(response.body.errors[0].statusCode).to.eq(409)
      expect(response.body.errors[0].message).to.contain('/api/projects')
    })
  })

  it('creates the same concept through the first-class Project endpoint', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/projects`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: `Correct Project Route ${stamp}`,
        slug,
        conductorSlug: slug,
        description: 'Created through the first-class Project API.',
        status: 'BRAINSTORM',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data.slug).to.eq(slug)
      expect(response.body.data.status).to.eq('BRAINSTORM')
      projectId = response.body.data.id
    })
  })

  after(() => {
    if (!projectId) return

    cy.request({
      method: 'DELETE',
      url: `${apiBase}/projects/${projectId}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    })
  })
})
