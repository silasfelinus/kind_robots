// cypress/e2e/api/bots.cy.js
/* eslint-disable no-undef */

describe('Bot Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/bots'
  const apiKey = Cypress.env('API_KEY')

  let createdBotId

  it('Create a New Bot', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        name: 'testbot',
        subtitle: 'An innovative bot',
        description: 'A bot created for testing purposes',
        avatarImage: 'http://example.com/avatar.png',
        botIntro: 'Welcome to testbot!',
        userIntro: 'How can I assist you today?',
        prompt: 'Tell me about your day.',
        personality: 'Friendly and helpful',
        isPublic: true,
        underConstruction: false,
        canDelete: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.bot).to.include({
        name: 'testbot',
        description: 'A bot created for testing purposes',
      })
      createdBotId = response.body.bot.id
    })
  })

  it('Create Bot with Invalid Data', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        name: '', // Invalid data
      },
      failOnStatusCode: false, // Important for handling negative tests
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body).to.have.property('success', false)
      expect(response.body.error).to.include('Name is required')
    })
  })

  it('Update the Newly Created Bot', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${createdBotId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        description: 'Updated description for the test bot',
        botIntro: 'Welcome to the updated Test Bot!',
        userIntro: 'I am here to help you better.',
        theme: 'Tech-savvy',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.bot).to.include({
        description: 'Updated description for the test bot',
        botIntro: 'Welcome to the updated Test Bot!',
        theme: 'cupcake',
      })
    })
  })

  it('Check Bot Existence and Details in General Listing', () => {
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
        name: 'testbot',
        description: 'Updated description for the test bot',
      })
    })
  })

  it('Delete the Created Bot', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${createdBotId}`,
      headers: {
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
