import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type TodoRow = {
  id: number
  userId: number | null
  title: string
  status: string
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  statusCode?: number
}

describe('Todo mutation input boundary', () => {
  const stamp = Date.now()

  let apiBase = ''
  let adminToken = ''
  let todosUrl = ''
  let ownerToken = ''
  let ownerId: number | undefined
  let todoId: number | undefined

  const ownerHeaders = () => bearerHeaders(ownerToken)

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        todosUrl = `${apiBase}/todos`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((owner) => {
        ownerToken = owner.token
        ownerId = owner.id
      })
  })

  after(() => {
    if (todoId && ownerToken) {
      cy.request({
        method: 'DELETE',
        url: `${todosUrl}/${todoId}`,
        headers: ownerHeaders(),
        failOnStatusCode: false,
      }).then(() => {
        todoId = undefined
      })
    }

    deleteTestUser(apiBase, adminToken, ownerId)
  })

  it('creates a Todo under the authenticated owner', () => {
    expect(ownerId).to.exist

    cy.request<ApiResponse<TodoRow>>({
      method: 'POST',
      url: todosUrl,
      headers: ownerHeaders(),
      body: {
        title: `BoundaryTodo-${stamp}`,
        priority: 'HIGH',
        category: 'AGENT',
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(ownerId)

      todoId = response.body.data?.id
      expect(todoId).to.be.a('number')
    })
  })

  it('rejects unknown fields on Todo creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: todosUrl,
      headers: ownerHeaders(),
      body: {
        title: `UnknownFieldTodo-${stamp}`,
        bogusField: 'nope',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported Todo fields')
    })
  })

  it('rejects unknown fields on Todo PATCH', () => {
    expect(todoId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${todosUrl}/${todoId}`,
      headers: ownerHeaders(),
      body: { bogusField: 'nope' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('Unsupported Todo fields')
    })
  })

  it('tolerates round-tripped system fields on Todo PATCH', () => {
    expect(todoId).to.exist
    expect(ownerId).to.exist

    // Identity/system columns are tolerated and ignored; the write stays scoped to
    // the authenticated owner and still succeeds.
    cy.request<ApiResponse<TodoRow>>({
      method: 'PATCH',
      url: `${todosUrl}/${todoId}`,
      headers: ownerHeaders(),
      body: {
        status: 'DONE',
        id: todoId,
        userId: ownerId,
        createdAt: new Date().toISOString(),
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.status).to.eq('DONE')
      expect(response.body.data?.userId).to.eq(ownerId)
    })
  })
})
