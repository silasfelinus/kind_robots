// cypress/e2e/bots.cy.js
/* eslint-disable no-undef */

describe('Bot Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/bots'
  const apiKey = Cypress.env('API_KEY')

  let createdBotId
  const botName = `testbot-${Date.now()}`

  it('Create a New Bot', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      createdBotId = response.body.bot.id
    })
  })

  it('Update Bot without Authentication (expect failure)', () => {
    const updateUrl = `${baseUrl}/name/${botName}/`
    cy.request({
      method: 'PATCH',
      url: updateUrl,
      headers: { 'Content-Type': 'application/json' },
      body: {
        description: 'Unauthorized update attempt',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Update Bot with Authentication', () => {
    const updateUrl = `${baseUrl}/name/${botName}/`
    cy.request({
      method: 'PATCH',
      url: updateUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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
      expect(response.body.bot).to.include({
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
      const bot = response.body.bots.find((bot) => bot.id === createdBotId)
      expect(bot).to.include({
        id: createdBotId,
        name: botName,
        description: 'Updated description for the test bot',
      })
    })
  })

  it('Delete Bot without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/id/${createdBotId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Delete Bot with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/id/${createdBotId}`,
      headers: {
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
