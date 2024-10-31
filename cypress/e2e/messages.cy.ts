/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/messages.cy.ts

describe('Message Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/messages'
  const apiKey = Cypress.env('API_KEY')
  let messageId: number
  const channelId: number = 2

  it('Create New Message', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        sender: 'WELCOMEBOT',
        recipient: 'Kind User',
        content: 'Hello! Welcome to our Livechat!',
        channelId,
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.newMessage).to.be.an('object').that.is.not.empty
      messageId = response.body.newMessage.id
    })
  })

  it('Get All Messages', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.messages)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Get Message by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${messageId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.message.sender).to.eq('WELCOMEBOT')
    })
  })

  it('Attempt to Update Message without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${messageId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        content: 'Unauthorized attempt to update message content',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Update Message with Authentication', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${messageId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        content: 'Hello! Welcome to our updated Livechat!',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)

      // Verify the update
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${messageId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.message.content).to.eq(
          'Hello! Welcome to our updated Livechat!',
        )
      })
    })
  })

  it('Attempt to Delete Message without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${messageId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Delete Message with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${messageId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  // Ensure any created messages are cleaned up
  after(() => {
    if (messageId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${messageId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    }
  })
})
