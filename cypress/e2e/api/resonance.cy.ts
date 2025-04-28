// /cypress/e2e/resonance.cy.ts

describe('resonance Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/resonance'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let resonanceId: number | undefined
  const uniqueresonanceTitle = `resonance-${Date.now()}`

  // 1. Create resonance without auth (should fail)
  it('should not allow creating a resonance without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      body: {
        title: uniqueresonanceTitle,
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

  // 2. Create resonance with invalid auth (should fail)
  it('should not allow creating a resonance with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        title: uniqueresonanceTitle,
        data: { test: 'Testing content' },
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // 3. Create resonance with valid auth (should succeed)
  it('should allow creating a resonance with valid authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        title: uniqueresonanceTitle,
        imagePath: '/images/test-resonance.png', // ✅ ADD THIS
        data: { test: 'Testing content' }, // (your API doesn't care about this currently, but harmless to keep)
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.have.property('id')
      resonanceId = response.body.data.id
    })
  })

  // 4. Get resonance by ID
  it('should retrieve a resonance by ID', () => {
    cy.wrap(resonanceId).should('exist')
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${resonanceId}`,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.title).to.eq(uniqueresonanceTitle)
    })
  })

  // 5. Get all resonances
  it('should retrieve all resonances', () => {
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

  // 6. Patch resonance (update title)
  it('should allow updating a resonance with valid authentication', () => {
    const updatedresonanceTitle = `Updated-${uniqueresonanceTitle}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${resonanceId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: { title: updatedresonanceTitle },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.title).to.eq(updatedresonanceTitle)
    })
  })

  // 7. Delete resonance without auth (should fail)
  it('should not allow deleting a resonance without authentication', () => {
    cy.wrap(resonanceId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${resonanceId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  // 8. Delete resonance with invalid auth (should fail)
  it('should not allow deleting a resonance with an invalid token', () => {
    cy.wrap(resonanceId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${resonanceId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  // 9. Delete resonance with valid auth (should succeed)
  it('should allow deleting a resonance with valid authentication', () => {
    cy.wrap(resonanceId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${resonanceId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(
        `resonance with ID ${resonanceId} successfully deleted`,
      )
    })
  })
})
