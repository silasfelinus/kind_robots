// cypress/e2e/api/scenario.cy.ts

describe('Scenario Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/scenarios'
  const invalidToken = 'someInvalidTokenValue'
  const uniqueScenarioTitle = `Scenario-${Date.now()}`

  let userToken = ''
  let scenarioId: number | undefined

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    })
  })

  it('should not allow creating a scenario without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
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

      expect(scenarioId).to.be.a('number')
    })
  })

  it('should retrieve a scenario by ID', () => {
    expect(scenarioId).to.exist

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

  it('should retrieve all scenarios', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
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

  it('should allow updating a scenario with valid authentication', () => {
    expect(scenarioId).to.exist

    const updatedScenarioTitle = `Updated-${uniqueScenarioTitle}`

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${scenarioId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        title: updatedScenarioTitle,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.title).to.eq(updatedScenarioTitle)
    })
  })

  it('should not allow deleting a scenario without authentication', () => {
    expect(scenarioId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${scenarioId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('should not allow deleting a scenario with an invalid token', () => {
    expect(scenarioId).to.exist

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

  it('should allow deleting a scenario with valid authentication', () => {
    expect(scenarioId).to.exist

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

      scenarioId = undefined
    })
  })
})
