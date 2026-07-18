import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  jsonHeaders,
} from '../../support/api-auth'

// cypress/e2e/api/prompts.cy.ts
describe('Prompt Management API Tests', () => {
  const invalidToken = 'someInvalidTokenValue'
  const uniquePrompt = `devil bunny ${Date.now()}`

  let apiBase = ''
  let baseUrl = ''
  let adminToken = ''
  let userToken = ''
  let userId = 0
  let promptId: number | undefined

  const expectPromptResource = (prompt: Record<string, unknown>) => {
    expect(prompt).to.have.property('id')
    expect(prompt).to.have.property('prompt')
    expect(prompt).to.have.property('userId')
    expect(prompt).to.not.have.property('User')
    expect(prompt).to.not.have.property('Bot')
    expect(prompt).to.not.have.property('ArtImage')
    expect(prompt).to.not.have.property('artIds')
  }

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        baseUrl = `${apiBase}/prompts`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        userToken = auth.token
        userId = auth.id
      })
  })

  after(() => {
    if (promptId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${promptId}`,
        headers: bearerHeaders(userToken),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, userId)
  })

  it('should not allow creating a prompt without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: jsonHeaders(),
      body: {
        userId,
        prompt: uniquePrompt,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('should not allow creating a prompt with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(invalidToken),
      body: {
        userId,
        prompt: uniquePrompt,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('creates a Prompt without returning related object graphs', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(userToken),
      body: {
        userId,
        prompt: uniquePrompt,
        creationSource: 'HUMAN',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expectPromptResource(response.body.data)

      promptId = response.body.data.id
      expect(promptId).to.be.a('number').and.greaterThan(0)
    })
  })

  it('should not update a prompt without authentication', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: jsonHeaders(),
      body: {
        prompt: 'unauthorized bunny update',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('should not update a prompt with an invalid token', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: bearerHeaders(invalidToken),
      body: {
        prompt: 'invalid token bunny update',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('updates a Prompt with the same resource-only shape', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: bearerHeaders(userToken),
      body: {
        prompt: 'angel bunny',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.prompt).to.eq('angel bunny')
      expectPromptResource(response.body.data)
    })
  })

  it('gets the Prompt resource without fetching related art', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'GET',
      url: `${baseUrl}/${promptId}`,
      headers: bearerHeaders(userToken),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.id).to.eq(promptId)
      expect(response.body.data.prompt).to.eq('angel bunny')
      expectPromptResource(response.body.data)
    })
  })

  it('gets all prompts', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: bearerHeaders(userToken),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('should not delete a prompt without authentication', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.match(
        /Authorization token is required|Invalid or expired token/,
      )
    })
  })

  it('should not delete a prompt with an invalid token', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: bearerHeaders(invalidToken),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.match(
        /Authorization token is required|Invalid or expired token/,
      )
    })
  })

  it('deletes a Prompt with authentication', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: bearerHeaders(userToken),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(
        `Prompt with ID ${promptId} successfully deleted.`,
      )
      promptId = undefined
    })
  })
})
