/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/bots.cy.js

describe('Bot Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/bots'
  const botUrl = 'https://kind-robots.vercel.app/api/bot'
  const apiKey = Cypress.env('API_KEY')
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'

  let createdBotId: number
  const botName = `testbot-${Date.now()}`

  it('should not allow creating a bot without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}`,
      headers: {
        'Content-Type': 'application/json',
      },
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
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow creating a bot with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
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
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create a New Bot with Valid Authentication', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
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
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('bot')
      createdBotId = response.body.data.bot.id
    })
  })

  it('should not allow updating a bot without an authorization token', () => {
    const updateUrl = `${botUrl}/id/${createdBotId}`
    cy.request({
      method: 'PATCH',
      url: updateUrl,
      headers: { 'Content-Type': 'application/json' },
      body: {
        description: 'Unauthorized update attempt',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow updating a bot with an invalid authorization token', () => {
    const updateUrl = `${botUrl}/id/${createdBotId}`
    cy.request({
      method: 'PATCH',
      url: updateUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
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
    const updateUrl = `${botUrl}/id/${createdBotId}`
    cy.request({
      method: 'PATCH',
      url: updateUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        description: 'Updated description for the test bot',
        botIntro: 'Welcome to the updated Test Bot!',
        theme: 'Tech-savvy',
        tagline: 'Now with advanced features',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('bot')
      expect(response.body.data.bot).to.include({
        description: 'Updated description for the test bot',
        tagline: 'Now with advanced features',
      })
    })
  })

  it('Fetch Bot Details in General Listing', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
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
    cy.request({
      method: 'DELETE',
      url: `${botUrl}/id/${createdBotId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow deleting a bot with an invalid authorization token', () => {
    cy.request({
      method: 'DELETE',
      url: `${botUrl}/id/${createdBotId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Delete Bot with Valid Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${botUrl}/id/${createdBotId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.message).to.include(
        `Bot with ID ${createdBotId} successfully deleted.`,
      )
    })
  })
})
