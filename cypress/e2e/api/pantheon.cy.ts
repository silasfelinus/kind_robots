// @ts-nocheck
/* eslint-disable */
// test-ignore

describe('Pantheon API Full CRUD + Ownership', () => {
  const baseUrl = `https://kind-robots.vercel.app/api/pantheon`
  const userUrl = `https://kind-robots.vercel.app/api/users`
  const globalApiKey = Cypress.env('API_KEY')

  let userA_id: number, userA_apiKey: string
  let userB_id: number, userB_apiKey: string
  let itemId: number

  const time = Date.now()
  const userA_name = `owner-${time}`
  const userB_name = `intruder-${time}`
  const name = `Pantheon-${time}`

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

  it('POST: User A creates a pantheon', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: { name, isPublic: true, names: ['Athena', 'Apollo'] },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      itemId = res.body.data.id
    })
  })

  it('GET: fetch all pantheons', () => {
    cy.request(baseUrl).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      const match = res.body.data.find((i: any) => i.id === itemId)
      expect(match).to.not.be.undefined
    })
  })

  it('GET: fetch pantheon by ID', () => {
    cy.request(`${baseUrl}/${itemId}`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.id).to.eq(itemId)
    })
  })

  it('PATCH: User A updates their pantheon', () => {
    const newName = `Updated-${name}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: { name: newName },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.data.name).to.eq(newName)
    })
  })

  it('PATCH: User B fails to update (403)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: { Authorization: `Bearer ${userB_apiKey}` },
      body: { name: 'unauthorized edit' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
    })
  })

  it('DELETE: User B fails to delete (403)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: { Authorization: `Bearer ${userB_apiKey}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
    })
  })

  it('DELETE: User A deletes pantheon', () => {
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
