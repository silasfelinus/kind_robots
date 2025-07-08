// /cypress/e2e/hybrid.cy.ts

describe('[Hybrid] API Full CRUD + Ownership Tests', () => {
  const modelName = 'hybrid'
  const baseUrl = `https://kind-robots.vercel.app/api/${modelName}s`
  const userUrl = `https://kind-robots.vercel.app/api/users`
  const globalApiKey = Cypress.env('API_KEY')

  let userA_id: number, userA_apiKey: string
  let userB_id: number, userB_apiKey: string
  let hybridId: number

  const time = Date.now()
  const userA_name = `owner-${time}`
  const userB_name = `intruder-${time}`
  const hybridName = `Hybrid-${time}`

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

  it('POST: User A creates a hybrid', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        name: hybridName,
        animalOne: 'Tiger',
        animalTwo: 'Eagle',
        blend: 70,
        promptString: 'A 70% Tiger and 30% Eagle hybrid.',
        result: 'It has powerful stripes and majestic wings.',
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.have.property('id')
      hybridId = res.body.data.id
    })
  })

  it('GET: fetch all hybrids', () => {
    cy.request(baseUrl).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      const match = res.body.data.find((i: any) => i.id === hybridId)
      expect(match).to.not.be.undefined
    })
  })

  it('GET: fetch hybrid by ID', () => {
    cy.request(`${baseUrl}/${hybridId}`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.id).to.eq(hybridId)
      expect(res.body.data.name).to.eq(hybridName)
    })
  })

  it('PATCH: User A updates their hybrid', () => {
    const newName = `Updated-${hybridName}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${hybridId}`,
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

  it('PATCH: User B fails to update hybrid (403)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${hybridId}`,
      headers: {
        Authorization: `Bearer ${userB_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: { name: 'unauthorized edit' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.message.toLowerCase()).to.include('permission')
    })
  })

  it('DELETE: User B fails to delete hybrid (403)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${hybridId}`,
      headers: { Authorization: `Bearer ${userB_apiKey}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.message.toLowerCase()).to.include('authorized')
    })
  })

  it('DELETE: User A deletes hybrid', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${hybridId}`,
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
