// cypress/e2e/api/botcafe.cy.ts

describe('BotCafe API Tests', function () {
  const chatUrl = 'https://kind-robots.vercel.app/api/botcafe/chat'
  const brainstormUrl = 'https://kind-robots.vercel.app/api/botcafe/brainstorm'

  let apiKey = ''
  let openaiApiKey = ''

  before(function () {
    cy.env(['DISABLE_EXTERNAL_TESTS', 'API_KEY', 'OPENAI_API_KEY']).then(
      (env) => {
        if (env.DISABLE_EXTERNAL_TESTS) {
          this.skip()
        }

        apiKey = String(env.API_KEY || '')
        openaiApiKey = String(env.OPENAI_API_KEY || '')

        expect(apiKey, 'API_KEY').to.be.a('string').and.not.be.empty
        expect(openaiApiKey, 'OPENAI_API_KEY').to.be.a('string').and.not.be
          .empty
      },
    )
  })

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
        cy.log('Chat response:', JSON.stringify(response.body))
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('id')
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
          messages: [
            {
              role: 'user',
              content: 'another original brainstorm',
            },
          ],
        },
      }).then((response) => {
        cy.log('Brainstorm response:', JSON.stringify(response.body))
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('id')
      })
    })
  })
})
