// /cypress/e2e/hybrids.cy.ts

describe('[Hybrid] API Full CRUD Tests (using USER_TOKEN)', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/hybrids'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'invalid-token'
  let hybridId: number | undefined
  const time = Date.now()
  const hybridName = `Hybrid-${time}`

  it('should not allow creating a hybrid without a token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: hybridName,
        animalOne: 'Tiger',
        animalTwo: 'Eagle',
        blend: 60,
        promptString: 'Hybrid of a tiger and eagle',
        result: 'Majestic wings with striped fur',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.message).to.include('Authorization token is required')
    })
  })

  it('should not allow creating a hybrid with an invalid token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        name: hybridName,
        animalOne: 'Tiger',
        animalTwo: 'Eagle',
        blend: 60,
        promptString: 'Hybrid of a tiger and eagle',
        result: 'Majestic wings with striped fur',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.message).to.include('Invalid or expired token')
    })
  })

  it('creates a new hybrid with valid token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        name: hybridName,
        animalOne: 'Tiger',
        animalTwo: 'Eagle',
        blend: 60,
        promptString: 'Hybrid of a tiger and eagle',
        result: 'Majestic wings with striped fur',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.name).to.eq(hybridName)
      hybridId = res.body.data.id
    })
  })

  it('retrieves the hybrid by ID', () => {
    cy.request(`${baseUrl}/${hybridId}`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.id).to.eq(hybridId)
    })
  })

  it('updates the hybrid with valid token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${hybridId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: { name: `Updated-${hybridName}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.name).to.eq(`Updated-${hybridName}`)
    })
  })

  it('fails to update hybrid without token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${hybridId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'Hacked!' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.message).to.include('Invalid or expired token.')
    })
  })

  it('fails to update hybrid with invalid token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${hybridId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: { name: 'Invalid Update' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.message).to.include('Invalid or expired token')
    })
  })

  it('retrieves all hybrids (authenticated)', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: { Authorization: `Bearer ${userToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('array')
    })
  })

  it('fails to delete hybrid without token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${hybridId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.message).to.include('Invalid or expired token.')
    })
  })

  it('fails to delete hybrid with invalid token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${hybridId}`,
      headers: { Authorization: `Bearer ${invalidToken}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.message).to.include('Invalid or expired token')
    })
  })

  it('deletes the hybrid with valid token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${hybridId}`,
      headers: { Authorization: `Bearer ${userToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.message).to.include(`${hybridId}`)
    })
  })
})
