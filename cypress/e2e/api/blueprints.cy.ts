// /cypress/e2e/blueprint.cy.ts
describe('[Blueprint] API Full CRUD + Ownership Tests', () => {
  const modelName = 'blueprint'
  const baseUrl = `https://kind-robots.vercel.app/api/${modelName}s`
  const userUrl = `https://kind-robots.vercel.app/api/users`
  const globalApiKey = Cypress.env('API_KEY')

  let userA_id: number, userA_apiKey: string
  let userB_id: number, userB_apiKey: string
  let itemId: number

  const time = Date.now()
  const userA_name = `owner-${time}`
  const userB_name = `intruder-${time}`
  const itemTitle = `Blueprint-${time}`

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

    cy.wrap(null)
      .then(() => register(userA_name))
      .then((res) => {
        userA_id = res.body.user.id
        userA_apiKey = res.body.user.apiKey
      })
      .then(() => register(userB_name))
      .then((res) => {
        userB_id = res.body.user.id
        userB_apiKey = res.body.user.apiKey
      })
  })

  it('POST: User A creates a blueprint', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: itemTitle,
        description: 'Test description',
        isPublic: true,
        isMature: false,
        steps: [{ action: 'generate', model: 'ChatGPT' }],
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.be.true
      itemId = res.body.data.id
    })
  })

  it('GET: fetch all blueprints', () => {
    cy.request(baseUrl).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      const match = res.body.data.find((i: any) => i.id === itemId)
      expect(match).to.not.be.undefined
    })
  })

  it('GET: fetch blueprint by ID', () => {
    cy.request(`${baseUrl}/${itemId}`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.id).to.eq(itemId)
    })
  })

  it('PATCH: User A updates their blueprint', () => {
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

  it('PATCH: User B fails to update blueprint (403)', () => {
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

  it('DELETE: User B fails to delete blueprint (403)', () => {
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

  it('DELETE: User A deletes blueprint', () => {
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
        failOnStatusCode: false,
      })

    if (userA_id && userA_apiKey) deleteUser(userA_id, userA_apiKey)
    if (userB_id && userB_apiKey) deleteUser(userB_id, userB_apiKey)
  })
})
