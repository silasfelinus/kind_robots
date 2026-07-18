import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  jsonHeaders,
} from '../../support/api-auth'

describe('Scenario Management API Tests', () => {
  const invalidToken = 'someInvalidTokenValue'
  const uniqueScenarioTitle = `Scenario-${Date.now()}`
  const uniqueBatchScenarioTitle = `Scenario-Batch-${Date.now()}`

  let apiBase = ''
  let baseUrl = ''
  let adminToken = ''
  let userToken = ''
  let userId: number | undefined
  let scenarioId: number | undefined
  let batchScenarioId: number | undefined

  const deleteScenario = (id?: number) => {
    if (!id || !userToken) return

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${id}`,
      headers: bearerHeaders(userToken),
      failOnStatusCode: false,
    })
  }

  const expectLeanMutation = (scenario: Record<string, unknown>) => {
    expect(scenario).to.not.have.property('ArtImage')
    expect(scenario).to.not.have.property('User')
    expect(scenario).to.not.have.property('Characters')
    expect(scenario).to.not.have.property('Dreams')
    expect(scenario).to.not.have.property('Facets')
    expect(scenario).to.not.have.property('_count')
  }

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        baseUrl = `${apiBase}/scenarios`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        userToken = auth.token
        userId = auth.id
      })
  })

  after(() => {
    deleteScenario(scenarioId)
    deleteScenario(batchScenarioId)
    deleteTestUser(apiBase, adminToken, userId)
  })

  it('should not allow creating a scenario without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: jsonHeaders(),
      body: {
        title: uniqueScenarioTitle,
        description: 'A unique scenario description.',
        intros: 'Scenario intros content here.',
        locations: 'Scenario locations here.',
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
      headers: bearerHeaders(invalidToken),
      body: {
        title: uniqueScenarioTitle,
        description: 'A unique scenario description.',
        intros: 'Scenario intros content here.',
        locations: 'Scenario locations here.',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('should allow creating a scenario with a lean mutation response', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(userToken),
      body: {
        title: uniqueScenarioTitle,
        description: 'A unique scenario description.',
        intros: 'Scenario intros content here.',
        locations: 'Scenario locations here.',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty
      expectLeanMutation(response.body.data)

      scenarioId = response.body.data.id
      expect(scenarioId).to.be.a('number').and.greaterThan(0)
    })
  })

  it('should return lean rows for batch creation too', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(userToken),
      body: [
        {
          title: uniqueBatchScenarioTitle,
          description: 'A batch scenario used to verify mutation boundaries.',
          intros: ['A suspiciously tidy opening scene.'],
          locations: 'Batch test location.',
          isPublic: false,
        },
      ],
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data.created).to.be.an('array').with.length(1)

      const scenario = response.body.data.created[0]
      expectLeanMutation(scenario)
      batchScenarioId = scenario.id
      expect(batchScenarioId).to.be.a('number').and.greaterThan(0)
    })
  })

  it('should retrieve a scenario by ID with its detail shape', () => {
    expect(scenarioId).to.exist

    cy.request({
      method: 'GET',
      url: `${baseUrl}/${scenarioId}`,
      headers: bearerHeaders(userToken),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.title).to.eq(uniqueScenarioTitle)
      expect(response.body.data).to.have.property('Dreams')
      expect(response.body.data).to.have.property('Characters')
      expect(response.body.data).to.have.property('Facets')
      expect(response.body.data).to.have.property('_count')
    })
  })

  it('should retrieve all scenarios', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: bearerHeaders(userToken),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('should allow updating a scenario with a lean mutation response', () => {
    expect(scenarioId).to.exist

    const updatedScenarioTitle = `Updated-${uniqueScenarioTitle}`

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${scenarioId}`,
      headers: bearerHeaders(userToken),
      body: {
        title: updatedScenarioTitle,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.title).to.eq(updatedScenarioTitle)
      expectLeanMutation(response.body.data)
    })
  })

  it('should not allow deleting a scenario without authentication', () => {
    expect(scenarioId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${scenarioId}`,
      headers: jsonHeaders(),
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
      headers: bearerHeaders(invalidToken),
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
      headers: bearerHeaders(userToken),
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
