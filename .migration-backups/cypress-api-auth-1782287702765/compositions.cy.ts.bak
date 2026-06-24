// @ts-nocheck
/* eslint-disable */
// test-ignore

// /cypress/e2e/api/composition.cy.ts
/// <reference types="cypress" />

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  statusCode?: number
}

describe('[Composition] API Full CRUD + Auth Tests', () => {
  const modelName = 'composition'
  const fallbackApiBase = 'https://kind-robots.vercel.app'
  const invalidToken = 'definitely-not-a-real-token'
  const testUserId = 9

  let apiBase = fallbackApiBase
  let baseUrl = `${fallbackApiBase}/api/${modelName}s`
  let userToken = ''
  let itemId: number

  const time = Date.now()
  const itemTitle = `COMPOSITION-${time}`

  before(() => {
    cy.env(['API_BASE', 'USER_TOKEN']).then((env) => {
      apiBase = String(env.API_BASE || fallbackApiBase)
      baseUrl = `${apiBase}/api/${modelName}s`
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'cy.env("USER_TOKEN")').to.be.a('string').and.not.be
        .empty
    })
  })

  it('POST: rejects without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      body: {
        title: `Unauth-${itemTitle}`,
        characterBlurb: 'A ghost',
        userId: testUserId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: rejects with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: `Bad-${itemTitle}`,
        characterBlurb: 'A ghost',
        userId: testUserId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: creates composition with valid auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: itemTitle,
        mode: 'both',
        characterBlurb: 'A weary cartographer with ink-stained hands.',
        dreamBlurb: 'A floating market above the clouds.',
        isPublic: true,
        userId: testUserId,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.have.property('id')
      itemId = res.body.data.id
      expect(itemId).to.be.a('number')
    })
  })

  it('GET: fetches all public compositions', () => {
    cy.request<ApiResponse<any[]>>({ method: 'GET', url: baseUrl }).then(
      (res) => {
        expect(res.status).to.eq(200)
        expect(res.body.success).to.eq(true)
        expect(res.body.data).to.be.an('array')
        expect(
          res.body.data?.find((item: any) => item.id === itemId),
        ).to.not.eq(undefined)
      },
    )
  })

  it('GET: fetches by ID', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/${itemId}`,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.data.id).to.eq(itemId)
      expect(res.body.data.characterBlurb).to.include('cartographer')
    })
  })

  it('PATCH: rejects update without auth', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      body: { title: 'No Auth Edit' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('PATCH: updates with valid auth (saving synthesis output)', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        narrativeText:
          'The cartographer spread her map across the floating market stall...',
        artPrompt:
          'floating market above clouds, ink-stained hands, fantasy, detailed, moody lighting',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.narrativeText).to.include('cartographer')
      expect(res.body.data.artPrompt).to.include('floating market')
    })
  })

  it('DELETE: rejects without auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: hard deletes with valid auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: { Authorization: `Bearer ${userToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
    })
  })

  it('GET: deleted record returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/${itemId}`,
      headers: { Authorization: `Bearer ${userToken}` },
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
      headers: { Authorization: `Bearer ${userToken}` },
      failOnStatusCode: false,
    })
  })
})
