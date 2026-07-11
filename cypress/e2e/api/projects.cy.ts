// /cypress/e2e/api/projects.cy.ts
import { createLoggedInTestUser } from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Project API', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/projects'
  const stamp = Date.now()
  const slug = `cypress-project-${stamp}`
  let token = ''
  let projectId = 0

  before(() => {
    createLoggedInTestUser().then((auth) => {
      token = auth.token
    })
  })

  it('creates a first-class Project instead of a Project Dream', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: `Cypress Project ${stamp}`,
        slug,
        conductorSlug: slug,
        description: 'Created by the Project API cutover test.',
        flavorText: 'Project rows are real now.',
        status: 'ACTIVE',
        priority: 'HIGH',
        channelKey: 'conductor',
        tabKey: slug,
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data.slug).to.eq(slug)
      expect(response.body.data.status).to.eq('ACTIVE')
      expect(response.body.data.priority).to.eq('HIGH')
      expect(response.body.data.channelKey).to.eq('conductor')
      projectId = response.body.data.id
    })
  })

  it('retrieves the same Project by slug', () => {
    cy.request({
      url: `${baseUrl}/${slug}`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data.id).to.eq(projectId)
      expect(response.body.data.conductorSlug).to.eq(slug)
    })
  })

  it('lists the authenticated user Projects', () => {
    cy.request({
      url: `${baseUrl}?mine=true&includeInactive=true`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data).to.be.an('array')
      expect(response.body.data.some((project: { id: number }) => project.id === projectId)).to.be.true
    })
  })

  it('updates placement and presentation fields', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${projectId}`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        priority: 'LOW',
        channelKey: 'projects',
        tabKey: `${slug}-updated`,
        liveUrl: '/projects/cypress',
        allowReviews: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data.priority).to.eq('LOW')
      expect(response.body.data.channelKey).to.eq('projects')
      expect(response.body.data.tabKey).to.eq(`${slug}-updated`)
      expect(response.body.data.allowReviews).to.be.true
    })
  })

  it('archives instead of destructively deleting the Project', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${projectId}`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data.isActive).to.be.false
      expect(response.body.data.status).to.eq('ARCHIVED')
    })
  })
})
