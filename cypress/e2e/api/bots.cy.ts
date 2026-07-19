import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  jsonHeaders,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type Bot = {
  id: number
  name: string
  description?: string
}

const expectLeanBot = (bot: Record<string, unknown>) => {
  expect(bot).to.not.have.property('User')
  expect(bot).to.not.have.property('Server')
  expect(bot).to.not.have.property('ArtImage')
  expect(bot).to.not.have.property('Dreams')
  expect(bot).to.not.have.property('ExpressionMedia')
  expect(bot).to.not.have.property('_count')
}

describe('Bot Management API Tests', () => {
  let apiRoot = ''
  let baseUrl = ''
  let adminToken = ''
  const invalidToken = 'someInvalidTokenValue'

  let userToken = ''
  let userId = 0
  let createdBotId: number | undefined

  const botName = `testbot-${Date.now()}`

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiRoot = env.apiBase
        adminToken = env.adminToken
        baseUrl = `${apiRoot}/bots`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        userToken = auth.token
        userId = auth.id
      })
  })

  after(() => {
    if (createdBotId && userToken) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${createdBotId}`,
        headers: bearerHeaders(userToken),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiRoot, adminToken, userId)
  })

  it('should not allow creating a bot without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: jsonHeaders(),
      body: {
        name: botName,
        subtitle: 'Unauthorized bot',
        description: 'Attempting to create a bot without token',
        avatarImage: '/images/bot.webp',
        botIntro: 'No token intro',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token.')
    })
  })

  it('should not allow creating a bot with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(invalidToken),
      body: {
        name: botName,
        subtitle: 'Unauthorized bot',
        description: 'Attempting to create a bot with an invalid token',
        avatarImage: '/images/bot.webp',
        botIntro: 'Invalid token intro',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token.')
    })
  })

  it('rejects client-supplied ownership during Bot creation', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(userToken),
      body: {
        name: `${botName}-spoofed-owner`,
        userId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Ownership is server-owned')
    })
  })

  it('creates a Bot with a lean mutation response', () => {
    expect(userId, 'shared Cypress user id').to.be.a('number').and.be.greaterThan(0)

    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(userToken),
      body: {
        name: botName,
        subtitle: 'An innovative bot',
        description: 'A bot created for testing purposes',
        avatarImage: '/images/bot.webp',
        botIntro: 'Welcome to testbot!',
        userIntro: 'How can I assist you today?',
        prompt: 'Tell me about your day.',
        personality: 'Friendly and helpful',
        isPublic: true,
        underConstruction: false,
        canDelete: true,
        BotType: 'CHATBOT',
        tagline: 'Your friendly AI companion',
        sampleResponse: 'I am here to help you!',
        modules: 'core, analytics',
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('data')
      expectLeanBot(response.body.data)

      createdBotId = response.body.data.id
      expect(createdBotId).to.be.a('number')
    })
  })

  it('should not allow updating a bot without an authorization token', () => {
    expect(createdBotId, 'createdBotId').to.be.a('number')

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${createdBotId}`,
      headers: jsonHeaders(),
      body: {
        description: 'Unauthorized update attempt',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token.')
    })
  })

  it('should not allow updating a bot with an invalid authorization token', () => {
    expect(createdBotId, 'createdBotId').to.be.a('number')

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${createdBotId}`,
      headers: bearerHeaders(invalidToken),
      body: {
        description: 'Invalid token update attempt',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('rejects ownership reassignment during singular and batch updates', () => {
    expect(createdBotId, 'createdBotId').to.be.a('number')

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${createdBotId}`,
      headers: bearerHeaders(userToken),
      body: { userId },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Ownership is server-owned')
    })

    cy.request({
      method: 'POST',
      url: `${baseUrl}/batch`,
      headers: bearerHeaders(userToken),
      body: [{ id: createdBotId, userId }],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Ownership is server-owned')
    })
  })

  it('updates a Bot with the same lean mutation response', () => {
    expect(createdBotId, 'createdBotId').to.be.a('number')

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${createdBotId}`,
      headers: bearerHeaders(userToken),
      body: {
        description: 'Updated description for the test bot',
        botIntro: 'Welcome to the updated Test Bot!',
        theme: 'Tech-savvy',
        tagline: 'Now with advanced features',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.include({
        id: createdBotId,
        description: 'Updated description for the test bot',
        tagline: 'Now with advanced features',
      })
      expectLeanBot(response.body.data)
    })
  })

  it('fetches Bot details in the general listing', () => {
    expect(createdBotId, 'createdBotId').to.be.a('number')

    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: bearerHeaders(userToken),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.be.an('array')

      const bot = response.body.data.find(
        (candidate: Bot) => candidate.id === createdBotId,
      )

      expect(bot).to.include({
        id: createdBotId,
        name: botName,
        description: 'Updated description for the test bot',
      })
    })
  })

  it('should not allow deleting a bot without an authorization token', () => {
    expect(createdBotId, 'createdBotId').to.be.a('number')

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${createdBotId}`,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token.')
    })
  })

  it('should not allow deleting a bot with an invalid authorization token', () => {
    expect(createdBotId, 'createdBotId').to.be.a('number')

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${createdBotId}`,
      headers: bearerHeaders(invalidToken),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('deletes a Bot with valid authentication', () => {
    expect(createdBotId, 'createdBotId').to.be.a('number')

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${createdBotId}`,
      headers: bearerHeaders(userToken),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.eq('Bot deleted successfully.')
      expect(response.body.data).to.have.property('id', createdBotId)

      createdBotId = undefined
    })
  })
})
