// /cypress/e2e/api/project-workspace.cy.ts
import { createLoggedInTestUser } from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('First-class Project workspace API', () => {
  const apiBase = 'https://kind-robots.vercel.app/api'
  const stamp = Date.now()
  const slug = `cypress-project-workspace-${stamp}`
  let token = ''
  let projectId = 0
  let todoId = 0

  before(() => {
    createLoggedInTestUser().then((auth) => {
      token = auth.token
    })
  })

  it('creates Project intent directly on a Project row', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/projects`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: `Project Workspace ${stamp}`,
        slug,
        conductorSlug: slug,
        description: 'Project detail workspace API coverage.',
        pitch: 'The north-star intent belongs to Project.',
        goal: 'All Project detail controls persist without a Project Dream.',
        waypoints: 'Create Project | ~ Exercise workspace | Verify persistence',
        status: 'ACTIVE',
        priority: 'HIGH',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data.pitch).to.eq(
        'The north-star intent belongs to Project.',
      )
      projectId = response.body.data.id
    })
  })

  it('updates Project detail fields without touching a Dream', () => {
    cy.request({
      method: 'PATCH',
      url: `${apiBase}/projects/${projectId}`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        pitch: 'Updated first-class Project intent.',
        goal: 'Project workspace cutover is complete.',
        waypoints: '✓ Create Project | ✓ Exercise workspace | ~ Verify persistence',
        status: 'PAUSED',
        priority: 'LOW',
        allowReviews: true,
        liveUrl: '/projects/cypress-workspace',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data.pitch).to.eq(
        'Updated first-class Project intent.',
      )
      expect(response.body.data.goal).to.eq(
        'Project workspace cutover is complete.',
      )
      expect(response.body.data.status).to.eq('PAUSED')
      expect(response.body.data.priority).to.eq('LOW')
      expect(response.body.data.allowReviews).to.be.true
    })
  })

  it('creates and retrieves a Project-scoped Todo', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/todos`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: `Project Todo ${stamp}`,
        description: 'This Todo is owned by Project, not only Dream.',
        category: 'DESIRED_FEATURE',
        priority: 'NORMAL',
        projectId,
        order: 0,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.data.projectId).to.eq(projectId)
      expect(response.body.data.dreamId).to.be.null
      todoId = response.body.data.id
    })

    cy.request({
      url: `${apiBase}/todos/project/${projectId}`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true

      const projectTodo = response.body.data.find(
        (todo: { id: number; projectId: number; dreamId: number | null }) =>
          todo.id === todoId,
      )

      expect(projectTodo).to.exist
      expect(projectTodo.projectId).to.eq(projectId)
      expect(projectTodo.dreamId).to.be.null
    })
  })

  it('persists the completed workspace state', () => {
    cy.request({
      url: `${apiBase}/projects/${slug}`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data.id).to.eq(projectId)
      expect(response.body.data.pitch).to.eq(
        'Updated first-class Project intent.',
      )
      expect(response.body.data.waypoints).to.include('Verify persistence')
      expect(response.body.data._count.Todos).to.be.greaterThan(0)
    })
  })

  after(() => {
    if (todoId) {
      cy.request({
        method: 'DELETE',
        url: `${apiBase}/todos/${todoId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      })
    }

    if (projectId) {
      cy.request({
        method: 'DELETE',
        url: `${apiBase}/projects/${projectId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      })
    }
  })
})
