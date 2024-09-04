// cypress/e2e/api/bots.cy.js
/* eslint-disable no-undef */

describe('Bot Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/bots'
  const apiKey = Cypress.env('API_KEY')

  let createdBotId
  const botName = `testbot-${Date.now()}`

  it('Create a New Bot', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}`, // Ensure URL is correct
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
        tagline: 'Your friendly AI companion', // New field
        sampleResponse: 'I am here to help you!', // New field
        modules: 'core, analytics', // New field
        userId: 1,
      },
    }).then((response) => {
      console.log(response.body) // Log the full response
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      if (response.body.bot) {
        expect(response.body.bot).to.include({
          name: botName,
          description: 'A bot created for testing purposes',
          tagline: 'Your friendly AI companion', // Check new field
          sampleResponse: 'I am here to help you!', // Check new field
        })
        createdBotId = response.body.bot.id
      } else {
        throw new Error('Bot object is missing in the response')
      }
    })
  })

  it('Update the Newly Created Bot', () => {
    const updateUrl = `https://kind-robots.vercel.app/api/bot/name/${botName}/`
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
        userIntro: 'I am here to help you better.',
        theme: 'Tech-savvy',
        modules: 'core, analytics, chat', // Update field
        tagline: 'Now with advanced features', // Update field
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.bot).to.include({
        description: 'Updated description for the test bot',
        botIntro: 'Welcome to the updated Test Bot!',
        tagline: 'Now with advanced features', // Check updated field
        modules: 'core, analytics, chat', // Check updated field
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
        name: `${botName}`,
        description: 'Updated description for the test bot',
        tagline: 'Now with advanced features', // Check new field
      })
    })
  })

  it('Delete the Created Bot', () => {
    cy.request({
      method: 'DELETE',
      url: `https://kind-robots.vercel.app/api/bot/id/${createdBotId}`,
      headers: {
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
