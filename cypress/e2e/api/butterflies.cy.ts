// @ts-nocheck
/* eslint-disable */
// test-ignore

// cypress/e2e/butterfly.cy.ts

describe('Butterfly API', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/butterflies'
  const recordsUrl = 'https://kind-robots.vercel.app/api/butterfly-records'
  const userUrl = 'https://kind-robots.vercel.app/api/users'
  const globalApiKey = Cypress.env('API_KEY')

  const time = Date.now()
  const userA_name = `collector-${time}`
  const userB_name = `intruder-${time}`

  let userA_id: number, userA_apiKey: string
  let userB_id: number, userB_apiKey: string
  let butterflyId: number // created by admin (globalApiKey) in before()
  let recordId: number // created when userA catches the butterfly

  // ─── setup: register two users + create a test butterfly species ───────────

  before(() => {
    const register = (username: string) =>
      cy.request({
        method: 'POST',
        url: `${userUrl}/register`,
        headers: { 'x-api-key': globalApiKey },
        body: {
          username,
          email: `${username}@test.com`,
          password: 'testtest12',
        },
      })

    register(userA_name).then((res) => {
      userA_id = res.body.user.id
      userA_apiKey = res.body.user.apiKey
    })

    register(userB_name).then((res) => {
      userB_id = res.body.user.id
      userB_apiKey = res.body.user.apiKey
    })

    // Create a test butterfly species as admin
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${globalApiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        name: `Cypress Flicker ${time}`,
        message: 'only appears in test environments',
        wingTopColor: 'hsl(120,70%,50%)',
        wingBottomColor: 'hsl(300,70%,50%)',
        speed: 0.5,
        wingSpeed: 0.09,
        scale: 1.0,
        rarityNumber: 9999,
        isPublic: true,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      butterflyId = res.body.data.id
    })
  })

  // ─── butterfly species (roster) ────────────────────────────────────────────

  it('GET /butterflies — returns public list, no auth required', () => {
    cy.request(baseUrl).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('array')
      const match = res.body.data.find((b: any) => b.id === butterflyId)
      expect(match).to.not.be.undefined
    })
  })

  it('GET /butterflies/:id — fetches a single species', () => {
    cy.request(`${baseUrl}/${butterflyId}`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.id).to.eq(butterflyId)
      expect(res.body.data.name).to.include('Cypress Flicker')
    })
  })

  it('GET /butterflies/:id — 404 for nonexistent ID', () => {
    cy.request({
      url: `${baseUrl}/999999999`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.be.false
    })
  })

  it('POST /butterflies — 403 for non-admin user', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        name: `Unauthorized Species ${time}`,
        message: 'should not exist',
        wingTopColor: 'hsl(0,50%,50%)',
        wingBottomColor: 'hsl(180,50%,50%)',
        speed: 0.5,
        wingSpeed: 0.08,
        scale: 1.0,
        rarityNumber: 9998,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
    })
  })

  it('PATCH /butterflies/:id — 403 for non-admin user', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${butterflyId}`,
      headers: { Authorization: `Bearer ${userA_apiKey}` },
      body: { message: 'unauthorized edit' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
    })
  })

  it('PATCH /butterflies/:id — admin can update a species', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${butterflyId}`,
      headers: {
        Authorization: `Bearer ${globalApiKey}`,
        'Content-Type': 'application/json',
      },
      body: { message: 'updated by cypress test' },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.data.message).to.eq('updated by cypress test')
    })
  })

  // ─── butterfly records (captures) ──────────────────────────────────────────

  it('POST /butterfly-records — 401 without auth', () => {
    cy.request({
      method: 'POST',
      url: recordsUrl,
      body: { butterflyId },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('POST /butterfly-records — userA catches a butterfly', () => {
    cy.request({
      method: 'POST',
      url: recordsUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: { butterflyId },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.be.true
      expect(res.body.data.Butterfly.id).to.eq(butterflyId)
      recordId = res.body.data.id
    })
  })

  it('POST /butterfly-records — 409 when catching same species twice', () => {
    cy.request({
      method: 'POST',
      url: recordsUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: { butterflyId },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(409)
      expect(res.body.message).to.include('already caught')
    })
  })

  it('GET /butterfly-records — userA sees their collection', () => {
    cy.request({
      url: recordsUrl,
      headers: { Authorization: `Bearer ${userA_apiKey}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.data).to.be.an('array')
      const match = res.body.data.find((r: any) => r.id === recordId)
      expect(match).to.not.be.undefined
    })
  })

  it('GET /butterfly-records — 401 without auth', () => {
    cy.request({
      url: recordsUrl,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('DELETE /butterfly-records/:id — userB cannot delete userA record (403)', () => {
    cy.request({
      method: 'DELETE',
      url: `${recordsUrl}/${recordId}`,
      headers: { Authorization: `Bearer ${userB_apiKey}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.message).to.include('authorized')
    })
  })

  it('DELETE /butterfly-records/:id — userA deletes their own record', () => {
    cy.request({
      method: 'DELETE',
      url: `${recordsUrl}/${recordId}`,
      headers: { Authorization: `Bearer ${userA_apiKey}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
    })
  })

  // ─── teardown ──────────────────────────────────────────────────────────────

  after(() => {
    // Delete the test butterfly species
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${butterflyId}`,
      headers: { Authorization: `Bearer ${globalApiKey}` },
    })

    // Delete test users
    const deleteUser = (id: number, apiKey: string) =>
      cy.request({
        method: 'DELETE',
        url: `${userUrl}/${id}`,
        headers: { Authorization: `Bearer ${apiKey}` },
      })

    deleteUser(userA_id, userA_apiKey)
    deleteUser(userB_id, userB_apiKey)
  })
})
