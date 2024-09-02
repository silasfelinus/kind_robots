// cypress/e2e/api/botcafe.cy.js
/* eslint-disable no-undef */

describe('BotCafe API Tests', function () {
  // Changed to a function declaration
  before(function () {
    // Changed to a function declaration
    // Skip all tests in this describe block if DISABLE_EXTERNAL_TESTS is set
    if (Cypress.env('DISABLE_EXTERNAL_TESTS')) {
      this.skip()
    }
  })

  const chatUrl = 'https://kind-robots.vercel.app/api/botcafe/chat'
  const brainstormUrl = 'https://kind-robots.vercel.app/api/botcafe/brainstorm'
  const apiKey = Cypress.env('API_KEY') // General API key for your app
  const openaiApiKey = Cypress.env('OPENAI_API_KEY') // OpenAI API key for GPT models

  context('BotCafe Chat and Brainstorm Tests', () => {
    it('Chat - Generate Haiku', () => {
      cy.request({
        method: 'POST',
        url: chatUrl,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-api-key': apiKey,
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: 'write me a haiku about butterflies fighting malaria',
            },
          ],
        },
      }).then((response) => {
        console.log(response.body) // Log the response body to see its structure
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('id') // Adjust this based on the actual response structure
      })
    })

    it('Brainstorm - Generate Ideas', () => {
      cy.request({
        method: 'POST',
        url: brainstormUrl,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-api-key': apiKey,
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: {
          model: 'gpt-4o-mini',
          n: 1,
          messages: [{ role: 'user', content: 'another original brainstorm' }],
        },
      }).then((response) => {
        console.log(response.body) // Log the response body to see its structure
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('id') // Adjust this based on the actual response structure
      })
    })
  })
})
