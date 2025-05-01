// @ts-nocheck
/* eslint-disable */
// test-ignore

//cypress/e2e/[model].cy.ts
describe('[Model] API Full CRUD + Ownership Tests', () => {
  const modelName = 'sample'
  const baseUrl = `https://your-app.com/api/${modelName}s`
  const userUrl = `https://your-app.com/api/users`
  const globalApiKey = Cypress.env('API_KEY')

  let userA_id: number, userA_apiKey: string
  let userB_id: number, userB_apiKey: string
  let itemId: number

  const time = Date.now()
  const userA_name = `owner-${time}`
  const userB_name = `intruder-${time}`
  const itemTitle = `${modelName.toUpperCase()}-${time}`

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
  })

  it('POST: User A creates a record', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: itemTitle,
        type: 'test',
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.be.true
      itemId = res.body.data.id
    })
  })

  it('GET: fetch all records', () => {
    cy.request(baseUrl).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      const match = res.body.data.find((i: any) => i.id === itemId)
      expect(match).to.not.be.undefined
    })
  })

  it('GET: fetch record by ID', () => {
    cy.request(`${baseUrl}/${itemId}`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.id).to.eq(itemId)
    })
  })

  it('PATCH: User A updates their record', () => {
    const newTitle = `Updated-${itemTitle}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: { title: newTitle },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.data.title).to.eq(newTitle)
    })
  })

  it('PATCH: User B fails to update record (403)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${userB_apiKey}`,
      },
      body: { title: 'unauthorized edit' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.message).to.include('permission')
    })
  })

  it('DELETE: User B fails to delete record (403)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: { Authorization: `Bearer ${userB_apiKey}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.message).to.include('authorized')
    })
  })

  it('DELETE: User A deletes record', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: { Authorization: `Bearer ${userA_apiKey}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
    })
  })

  after(() => {
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
