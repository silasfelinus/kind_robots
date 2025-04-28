// /cypress/e2e/resonate.cy.ts

describe('Resonate Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/resonate'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let resonateId: number | undefined
  const uniqueResonateTitle = `Resonate-${Date.now()}`

  // 1. Create resonate without auth (should fail)
  it('should not allow creating a resonate without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      body: {
        title: uniqueResonateTitle,
        data: { test: 'Testing content' },
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // 2. Create resonate with invalid auth (should fail)
  it('should not allow creating a resonate with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        title: uniqueResonateTitle,
        data: { test: 'Testing content' },
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // 3. Create resonate with valid auth (should succeed)
  it('should allow creating a resonate with valid authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        title: uniqueResonateTitle,
        data: { test: 'Testing content' },
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.have.property('id')
      resonateId = response.body.data.id
    })
  })

  // 4. Get resonate by ID
  it('should retrieve a resonate by ID', () => {
    cy.wrap(resonateId).should('exist')
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${resonateId}`,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.title).to.eq(uniqueResonateTitle)
    })
  })

  // 5. Get all resonates
  it('should retrieve all resonates', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}`,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // 6. Patch resonate (update title)
  it('should allow updating a resonate with valid authentication', () => {
    const updatedResonateTitle = `Updated-${uniqueResonateTitle}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${resonateId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: { title: updatedResonateTitle },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.title).to.eq(updatedResonateTitle)
    })
  })

  // 7. Delete resonate without auth (should fail)
  it('should not allow deleting a resonate without authentication', () => {
    cy.wrap(resonateId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${resonateId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  // 8. Delete resonate with invalid auth (should fail)
  it('should not allow deleting a resonate with an invalid token', () => {
    cy.wrap(resonateId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${resonateId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  // 9. Delete resonate with valid auth (should succeed)
  it('should allow deleting a resonate with valid authentication', () => {
    cy.wrap(resonateId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${resonateId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(
        `Resonate with ID ${resonateId} successfully deleted`,
      )
    })
  })
})
