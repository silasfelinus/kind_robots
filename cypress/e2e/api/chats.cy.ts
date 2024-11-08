// cypress/e2e/chats.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Chat API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/chats'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let chatId: number
  const userId = 9
  const botId = 1

  // Helper function to make requests with optional token and body
  const makeRequest = (
    method: string,
    url: string,
    token: string | null,
    body?: object,
  ) => {
    return cy.request({
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body,
      failOnStatusCode: false,
    })
  }

  // === AUTHORIZATION TESTS ===
  it('should not allow creating a chat without an authorization token', () => {
    makeRequest('POST', baseUrl, null, {
      type: 'UserToBot',
      sender: 'silasfelinus',
      recipient: 'AMI',
      content: 'Hello, AMI!',
      userId,
      botId,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include('Failed to create chat entry')
    })
  })

  it('should not allow creating a chat with an invalid authorization token', () => {
    makeRequest('POST', baseUrl, invalidToken, {
      type: 'UserToBot',
      sender: 'silasfelinus',
      recipient: 'AMI',
      content: 'Hello, AMI!',
      userId,
      botId,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include('Failed to create chat entry')
    })
  })

  // === CREATION TEST ===
  it('Create a new Chat with valid authentication', () => {
    cy.request({
      method: 'POST',
      url: 'https://kind-robots.vercel.app/api/chats',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        type: 'ToBot',
        sender: 'silasfelinus',
        recipient: 'AMI',
        content: 'Hello, AMI!',
        title: 'Greeting',
        channel: 'general',
        isPublic: true,
        isFavorite: false,
        previousEntryId: null,
        originId: null,
        botId: 1,
        recipientId: null,
        artImageId: null,
        promptId: null,
        botName: 'AMI',
      },
      failOnStatusCode: false,
    }).then((response) => {
      // Validate the response status code and structure
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.be.an('object').that.is.not.empty

      // Capture the chat ID for further use in other tests if needed
      const chatId = response.body.data.id
      expect(chatId).to.exist
    })
  })

  // === RETRIEVAL TESTS ===
  it('Get Chat by ID', () => {
    makeRequest('GET', `${baseUrl}/${chatId}`, userToken).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.sender).to.eq('silasfelinus')
    })
  })

  it('Get All Chats', () => {
    makeRequest('GET', baseUrl, userToken).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Get Chats by User ID', () => {
    makeRequest('GET', `${baseUrl}/user/${userId}`, userToken).then(
      (response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body.data)
          .to.be.an('array')
          .and.have.length.greaterThan(0)
      },
    )
  })

  it('Get Chats by Bot ID', () => {
    makeRequest('GET', `${baseUrl}/bot/${botId}`, userToken).then(
      (response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body.data)
          .to.be.an('array')
          .and.have.length.greaterThan(0)
      },
    )
  })

  // === UPDATE TESTS ===
  it('Update Chat with Valid Authentication', () => {
    makeRequest('PATCH', `${baseUrl}/${chatId}`, userToken, {
      content: 'Hello again, AMI!',
      isFavorite: true,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.isFavorite).to.eq(true)
    })
  })

  // === DELETION TESTS ===
  it('should not allow deleting a chat without an authorization token', () => {
    makeRequest('DELETE', `${baseUrl}/${chatId}`, null).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow deleting a chat with an invalid authorization token', () => {
    makeRequest('DELETE', `${baseUrl}/${chatId}`, invalidToken).then(
      (response) => {
        expect(response.status).to.eq(401)
        expect(response.body).to.have.property('success', false)
        expect(response.body.message).to.include('Invalid or expired token')
      },
    )
  })

  it('Delete Chat with Valid Authentication', () => {
    makeRequest('DELETE', `${baseUrl}/${chatId}`, userToken).then(
      (response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body.message).to.include(
          `Chat with ID ${chatId} successfully deleted`,
        )
      },
    )
  })
})
