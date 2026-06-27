/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/api/todos.cy.ts
import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  jsonHeaders,
} from '../../support/api-auth'

describe('Todo API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/todos'
  const badJwt = 'definitely-not-valid'
  const uniqueTitle = `Todo-${Date.now()}`

  let apiBase = ''
  let setupAuth = ''
  let userJwt = ''
  let createdUserId: number | undefined
  let todoId: number | undefined

  before(() => {
    getApiEnv().then((env) => {
      apiBase = env.apiBase
      setupAuth = env.adminToken
    })

    createLoggedInTestUser().then((auth) => {
      userJwt = auth.token
      createdUserId = auth.id
    })
  })

  after(() => {
    if (todoId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${todoId}`,
        headers: bearerHeaders(userJwt),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, setupAuth, createdUserId)
  })

  it('should return 401 fetching todos without auth', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('should return 401 fetching todos with invalid token', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: bearerHeaders(badJwt),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('should return 401 creating a todo without auth', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: jsonHeaders(),
      body: { title: uniqueTitle },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('should return 401 creating a todo with invalid token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(badJwt),
      body: { title: uniqueTitle },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('should return 400 creating a todo without a title', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(userJwt),
      body: {},
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
    })
  })

  it('Create a new Todo with valid authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(userJwt),
      body: {
        title: uniqueTitle,
        description: 'Cypress test todo',
        priority: 'HIGH',
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object')
      expect(response.body.data.title).to.eq(uniqueTitle)
      expect(response.body.data.status).to.eq('OPEN')
      expect(response.body.data.priority).to.eq('HIGH')
      todoId = response.body.data.id
    })
  })

  it('Fetch all todos for the authenticated user', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: bearerHeaders(userJwt),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('array').and.have.length.greaterThan(0)
      const found = response.body.data.find((t: { id: number }) => t.id === todoId)
      expect(found).to.exist
    })
  })

  it('Fetch todos filtered by status=OPEN', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}?status=OPEN`,
      headers: bearerHeaders(userJwt),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      response.body.data.forEach((t: { status: string }) => {
        expect(t.status).to.eq('OPEN')
      })
    })
  })

  it('should return 401 updating a todo without auth', () => {
    expect(todoId).to.exist
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${todoId}`,
      headers: jsonHeaders(),
      body: { title: 'Should not work' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('should return 401 updating a todo with invalid token', () => {
    expect(todoId).to.exist
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${todoId}`,
      headers: bearerHeaders(badJwt),
      body: { title: 'Should not work' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('Update todo title with valid authentication', () => {
    expect(todoId).to.exist
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${todoId}`,
      headers: bearerHeaders(userJwt),
      body: { title: `Updated-${uniqueTitle}` },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.title).to.eq(`Updated-${uniqueTitle}`)
    })
  })

  it('Mark todo as DONE', () => {
    expect(todoId).to.exist
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${todoId}`,
      headers: bearerHeaders(userJwt),
      body: { status: 'DONE' },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data.status).to.eq('DONE')
    })
  })

  it('Archive a todo', () => {
    expect(todoId).to.exist
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${todoId}`,
      headers: bearerHeaders(userJwt),
      body: { status: 'ARCHIVED' },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data.status).to.eq('ARCHIVED')
    })
  })

  it('Archived todo absent from default GET', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: bearerHeaders(userJwt),
    }).then((response) => {
      expect(response.status).to.eq(200)
      const found = response.body.data.find((t: { id: number }) => t.id === todoId)
      expect(found).to.be.undefined
    })
  })

  it('Archived todo visible with includeArchived=true', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}?includeArchived=true`,
      headers: bearerHeaders(userJwt),
    }).then((response) => {
      expect(response.status).to.eq(200)
      const found = response.body.data.find((t: { id: number }) => t.id === todoId)
      expect(found).to.exist
    })
  })

  it('should return 401 deleting a todo without auth', () => {
    expect(todoId).to.exist
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${todoId}`,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('should return 401 deleting a todo with invalid token', () => {
    expect(todoId).to.exist
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${todoId}`,
      headers: bearerHeaders(badJwt),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('Delete todo with valid authentication', () => {
    expect(todoId).to.exist
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${todoId}`,
      headers: bearerHeaders(userJwt),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include('deleted')
      todoId = undefined
    })
  })
})
