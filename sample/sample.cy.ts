// @ts-nocheck
/* eslint-disable */
// test-ignore

// /cypress/e2e/api/sample.cy.ts
/// <reference types="cypress" />

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  statusCode?: number
}

describe('[Model] API Full CRUD + Ownership Tests', () => {
  const modelName = 'sample'
  const API_BASE = Cypress.env('API_BASE') ?? 'https://kind-robots.vercel.app'
  const baseUrl = `${API_BASE}/api/${modelName}s`

  const userToken = Cypress.env('USER_TOKEN')
  const intruderToken = Cypress.env('INTRUDER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  const testUserId = 9

  let itemId: number

  const time = Date.now()
  const itemTitle = `${modelName.toUpperCase()}-${time}`

  before(() => {
    expect(userToken, 'Cypress.env("USER_TOKEN")').to.be.a('string').and.not.be
      .empty
  })

  it('POST: rejects record creation without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        title: `Unauthorized-${itemTitle}`,
        type: 'test',
        userId: testUserId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: rejects record creation with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: `Invalid-${itemTitle}`,
        type: 'test',
        userId: testUserId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: creates a record with valid auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: itemTitle,
        type: 'test',
        userId: testUserId,
        isPublic: true,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.have.property('id')

      itemId = res.body.data.id

      expect(itemId).to.be.a('number')
    })
  })

  it('GET: fetch all public records', () => {
    cy.request<ApiResponse<any[]>>({
      method: 'GET',
      url: baseUrl,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.be.an('array')

      const match = res.body.data?.find((item: any) => item.id === itemId)

      expect(match).to.not.eq(undefined)
    })
  })

  it('GET: fetch all records visible to authenticated user', () => {
    cy.request<ApiResponse<any[]>>({
      method: 'GET',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.be.an('array')

      const match = res.body.data?.find((item: any) => item.id === itemId)

      expect(match).to.not.eq(undefined)
    })
  })

  it('GET: fetch record by ID', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/${itemId}`,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.id).to.eq(itemId)
    })
  })

  it('PATCH: rejects update without auth', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        title: 'No Auth Edit',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('PATCH: rejects update with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: 'Invalid Auth Edit',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('PATCH: updates record with valid auth', () => {
    const newTitle = `Updated-${itemTitle}`

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: newTitle,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.title).to.eq(newTitle)
    })
  })

  it('PATCH: intruder fails to update record', function () {
    if (!intruderToken) this.skip()

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${intruderToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: 'Unauthorized Edit',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.include('permission')
    })
  })

  it('DELETE: rejects delete without auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: rejects delete with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: intruder fails to delete record', function () {
    if (!intruderToken) this.skip()

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${intruderToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.include('authorized')
    })
  })

  it('DELETE: hard deletes record with valid auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.id).to.eq(itemId)
    })
  })

  it('GET: hard-deleted record returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.eq(false)
    })
  })

  after(() => {
    if (!itemId || !userToken) return

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
    })
  })
})
