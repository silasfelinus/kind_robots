// cypress/e2e/messages.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Message Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/messages'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let messageId: number | undefined
  const channelId: number = 2 // Sample channel ID

  // Step 1: Attempt to create a message with various authentication scenarios

  it('should not allow creating a message without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        sender: 'WELCOMEBOT',
        recipient: 'Kind User',
        content: 'Hello! Welcome to our Livechat!',
        channelId,
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow creating a message with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        sender: 'WELCOMEBOT',
        recipient: 'Kind User',
        content: 'Hello! Welcome to our Livechat!',
        channelId,
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create New Message with Valid Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        sender: 'WELCOMEBOT',
        recipient: 'Kind User',
        content: 'Hello! Welcome to our Livechat!',
        channelId,
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.newMessage).to.be.an('object').that.is.not.empty
      messageId = response.body.newMessage.id
    })
  })

  // Step 2: Retrieve all messages
  it('Get All Messages', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.messages)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // Step 3: Retrieve message by ID
  it('Get Message by ID', () => {
    cy.wrap(messageId).should('exist') // Ensure messageId exists
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${messageId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.message.sender).to.eq('WELCOMEBOT')
    })
  })

  // Step 4: Attempt to update message without authentication
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
      expect(response.status).to.eq(401) // Unauthorized without token
    })
  })

  // Step 5: Update message with valid authentication
  it('Update Message with Authentication', () => {
    cy.wrap(messageId).should('exist') // Ensure messageId exists
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${messageId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
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
          Authorization: `Bearer ${userToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.message.content).to.eq(
          'Hello! Welcome to our updated Livechat!',
        )
      })
    })
  })

  // Step 6: Attempt to delete message without authentication
  it('Attempt to Delete Message without Authentication (expect failure)', () => {
    cy.wrap(messageId).should('exist') // Ensure messageId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${messageId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })
  })

  // Step 7: Delete message with valid authentication
  it('Delete Message with Authentication', () => {
    cy.wrap(messageId).should('exist') // Ensure messageId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${messageId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
