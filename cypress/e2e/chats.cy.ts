/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/chats.cy.ts

describe('ChatExchange Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/chats'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let chatExchangeId: number
  const userId: number = 9
  const botId: number = 1

  it('Create a New Chat Exchange', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        userId,
        botId,
        botName: 'AMI',
        username: 'silasfelinus',
        userPrompt: 'How are you?',
        botResponse: "I'm fine, thank you!",
        previousEntryId: null,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.newExchange).to.be.an('object').that.is.not.empty
      chatExchangeId = response.body.newExchange.id
    })
  })

  it('Get Chat Exchange by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${chatExchangeId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.chatExchanges.botName).to.eq('AMI')
    })
  })

  it('Get All Chat Exchanges', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.chatExchanges)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Get Chat Exchanges by User ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/user/${userId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.userChats)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Get Chat Exchanges by Bot ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/bot/${botId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.botChats)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('should not allow updating a chat exchange without an authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${chatExchangeId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        userPrompt: 'Unauthorized update attempt',
        botResponse: "I'm great, unauthorized attempt!",
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization header is missing',
      )
    })
  })

  it('should not allow updating a chat exchange with an invalid authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${chatExchangeId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        userPrompt: 'Invalid token update attempt',
        botResponse: "I'm great, invalid attempt!",
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Update Chat Exchange with Valid Authentication', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${chatExchangeId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        userPrompt: 'How are you?',
        botResponse: "I'm great, thank you!",
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it('should not allow deleting a chat exchange without an authorization token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${chatExchangeId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow deleting a chat exchange with an invalid authorization token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${chatExchangeId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Delete Chat Exchange with Valid Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${chatExchangeId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
