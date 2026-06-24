/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/api/bots.cy.ts

type Bot = {
  id: number
  name: string
  description?: string
}

type CypressEnv = {
  API_KEY?: string
  BASE_API_URL?: string
}

describe('Bot Management API Tests', () => {
  let apiRoot = 'https://kind-robots.vercel.app/api'
  let baseUrl = `${apiRoot}/bots`
  let usersUrl = `${apiRoot}/users`
  let authUrl = `${apiRoot}/auth`
  const invalidToken = 'someInvalidTokenValue'
  const testPassword = 'testtest12'

  let apiKey = ''
  let userToken = ''
  let createdBotId: number | undefined
  let createdUserId: number | undefined
  let testUsername = ''

  const botName = `testbot-${Date.now()}`

  const jsonHeaders = () => ({
    Accept: 'application/json',
    'Content-Type': 'application/json',
  })

  const bearerHeaders = (token: string) => ({
    ...jsonHeaders(),
    Authorization: `Bearer ${token}`,
  })

  const apiKeyHeaders = () => ({
    ...jsonHeaders(),
    'x-api-key': apiKey,
  })

  const loginTestUser = () => {
    expect(testUsername, 'testUsername').to.be.a('string').and.not.be.empty
    expect(createdUserId, 'createdUserId before login').to.be.a('number')

    return cy
      .request({
        method: 'POST',
        url: `${authUrl}/login`,
        headers: jsonHeaders(),
        body: {
          username: testUsername,
          password: testPassword,
        },
        failOnStatusCode: false,
      })
      .then((response) => {
        expect(
          response.status,
          `login status: ${response.status} ${JSON.stringify(response.body)}`,
        ).to.eq(200)
        expect(response.body).to.have.property('success', true)

        const token = response.body?.data?.token || response.body?.token

        expect(token, 'login token')
          .to.be.a('string')
          .and.have.length.greaterThan(20)

        userToken = token
      })
  }

  before(() => {
    cy.env(['API_KEY', 'BASE_API_URL']).then((env: CypressEnv) => {
      apiKey = String(env.API_KEY || '')
      apiRoot = String(env.BASE_API_URL || apiRoot).replace(/\/+$/, '')
      baseUrl = `${apiRoot}/bots`
      usersUrl = `${apiRoot}/users`
      authUrl = `${apiRoot}/auth`

      expect(apiKey, 'API_KEY').to.be.a('string').and.not.be.empty
      expect(apiRoot, 'BASE_API_URL').to.be.a('string').and.not.be.empty
    })

    cy.then(() => {
      testUsername = `botstest${Date.now()}`
      const userEmail = `${testUsername}@kindrobots.org`

      cy.request({
        method: 'POST',
        url: `${usersUrl}/register`,
        headers: apiKeyHeaders(),
        body: {
          username: testUsername,
          email: userEmail,
          password: testPassword,
        },
        failOnStatusCode: false,
      })
        .then((response) => {
          expect(
            response.status,
            `register status: ${response.status} ${JSON.stringify(response.body)}`,
          ).to.be.oneOf([200, 201])
          expect(response.body).to.have.property('success', true)
          expect(response.body).to.have.property('user')

          createdUserId = response.body.user.id

          expect(createdUserId, 'registered user id').to.be.a('number')
        })
        .then(() => loginTestUser())
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

    if (createdUserId && userToken) {
      cy.request({
        method: 'DELETE',
        url: `${usersUrl}/${createdUserId}`,
        headers: bearerHeaders(userToken),
        failOnStatusCode: false,
      })
    }
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

  it('Create a New Bot with Valid Authentication', () => {
    expect(userToken, 'userToken').to.be.a('string').and.not.be.empty
    expect(createdUserId, 'createdUserId').to.be.a('number')

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
        userId: createdUserId,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('data')

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

  it('Update Bot with Valid Authentication', () => {
    expect(createdBotId, 'createdBotId').to.be.a('number')
    expect(userToken, 'userToken').to.be.a('string').and.not.be.empty

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
      expect(response.body.data).to.have.property('id')
      expect(response.body.data).to.include({
        description: 'Updated description for the test bot',
        tagline: 'Now with advanced features',
      })
    })
  })

  it('Fetch Bot Details in General Listing', () => {
    expect(createdBotId, 'createdBotId').to.be.a('number')

    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: apiKeyHeaders(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.be.an('array')

      const bot = response.body.data.find((bot: Bot) => bot.id === createdBotId)

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

  it('Delete Bot with Valid Authentication', () => {
    expect(createdBotId, 'createdBotId').to.be.a('number')
    expect(userToken, 'userToken').to.be.a('string').and.not.be.empty

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