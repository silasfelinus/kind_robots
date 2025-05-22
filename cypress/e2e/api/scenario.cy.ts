// cypress/e2e/scenario.cy.ts

describe('Scenario Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/scenarios'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let scenarioId: number | undefined
  const uniqueScenarioTitle = `Scenario-${Date.now()}`

  // Step 1: Attempt to create a scenario without an authorization token
  it('should not allow creating a scenario without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      body: {
        title: uniqueScenarioTitle,
        description: 'A unique scenario description.',
        intros: 'Scenario intros content here.',
        locations: 'Scenario locations here.',
        userId: 1, // Replace with valid user ID for tests
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Step 2: Attempt to create a scenario with an invalid authorization token
  it('should not allow creating a scenario with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        title: uniqueScenarioTitle,
        description: 'A unique scenario description.',
        intros: 'Scenario intros content here.',
        locations: 'Scenario locations here.',
        userId: 1,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Step 3: Create a new scenario with valid authentication
  it('should allow creating a scenario with valid authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        title: uniqueScenarioTitle,
        description: 'A unique scenario description.',
        intros: 'Scenario intros content here.',
        locations: 'Scenario locations here.',
        userId: 1,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty
      scenarioId = response.body.data.id
    })
  })

  // Step 4: Retrieve the scenario by ID
  it('should retrieve a scenario by ID', () => {
    cy.wrap(scenarioId).should('exist')
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${scenarioId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.title).to.eq(uniqueScenarioTitle)
    })
  })

  // Step 5: Retrieve all scenarios
  it('should retrieve all scenarios', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // Step 6: Update the scenario with valid authentication
  it('should allow updating a scenario with valid authentication', () => {
    const updatedScenarioTitle = `Updated-${uniqueScenarioTitle}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${scenarioId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: { title: updatedScenarioTitle },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.title).to.eq(updatedScenarioTitle)
    })
  })

  // Step 7: Attempt to delete the scenario without authentication
  it('should not allow deleting a scenario without authentication', () => {
    cy.wrap(scenarioId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${scenarioId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  // Step 8: Attempt to delete the scenario with an invalid token
  it('should not allow deleting a scenario with an invalid token', () => {
    cy.wrap(scenarioId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${scenarioId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  // Step 9: Delete the scenario with valid authentication
  it('should allow deleting a scenario with valid authentication', () => {
    cy.wrap(scenarioId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${scenarioId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(
        `Scenario with ID ${scenarioId} successfully deleted`,
      )
    })
  })
})
