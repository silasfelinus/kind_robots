// /cypress/e2e/api/legacy-project-dream-readonly.cy.ts
import { createLoggedInTestUser } from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Legacy Project Dream write guards', () => {
  const apiBase = 'https://kind-robots.vercel.app/api'
  const stamp = Date.now()
  let token = ''
  let dreamId = 0

  before(() => {
    createLoggedInTestUser().then((auth) => {
      token = auth.token
    })
  })

  it('creates an ordinary Dream for mutation tests', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/dreams`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: `Project Guard Dream ${stamp}`,
        slug: `project-guard-dream-${stamp}`,
        dreamType: 'PITCH',
        description: 'A normal Dream must not become a Project through PATCH.',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      dreamId = response.body.data.id
    })
  })

  it('rejects changing a Dream into a Project', () => {
    cy.request({
      method: 'PATCH',
      url: `${apiBase}/dreams/${dreamId}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
      body: { dreamType: 'PROJECT' },
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.contain('/api/projects')
    })
  })

  it('rejects Project-only metadata on a Dream', () => {
    cy.request({
      method: 'PATCH',
      url: `${apiBase}/dreams/${dreamId}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
      body: {
        projectStatus: 'ACTIVE',
        repoUrl: 'https://example.invalid/not-a-dream-project',
      },
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.contain('/api/projects')
    })
  })

  after(() => {
    if (!dreamId) return

    cy.request({
      method: 'DELETE',
      url: `${apiBase}/dreams/${dreamId}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    })
  })
})
