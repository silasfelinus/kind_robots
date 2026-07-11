// /cypress/e2e/api/legacy-project-dream-readonly.cy.ts
import { createLoggedInTestUser } from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type DreamSummary = {
  id: number
  dreamType: string
}

describe('Legacy Project Dream write guards', () => {
  const apiBase = 'https://kind-robots.vercel.app/api'
  const stamp = Date.now()
  let token = ''
  let dreamId = 0
  let legacyProjectDreamId = 0

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

  it('finds a readable legacy Project Dream compatibility row', () => {
    cy.request({
      method: 'GET',
      url: `${apiBase}/dreams?dreamType=PROJECT&limit=1`,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('array').and.not.be.empty

      const projectDream = (response.body.data as DreamSummary[]).find(
        (dream) => dream.dreamType === 'PROJECT',
      )
      expect(projectDream).to.exist
      legacyProjectDreamId = projectDream?.id ?? 0
    })
  })

  it('rejects new chats through a legacy Project Dream ID', () => {
    expect(legacyProjectDreamId).to.be.greaterThan(0)

    cy.request({
      method: 'POST',
      url: `${apiBase}/chats`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
      body: {
        type: 'Dream',
        sender: 'Cypress Project Guard',
        content: 'This chat must be routed through projectId instead.',
        dreamId: legacyProjectDreamId,
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.contain('projectId')
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
