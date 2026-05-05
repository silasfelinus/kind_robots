// cypress/e2e/api/chats.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Chat API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/chats'
  const invalidToken = 'someInvalidTokenValue'
  const userId = 9
  const botId = 1

  let userToken = ''
  let chatId: number | null = null

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    })
  })

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
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      failOnStatusCode: false,
    })
  }

  it('should not allow creating a chat without an authorization token', () => {
    makeRequest('POST', baseUrl, null, {
      type: 'ToBot',
      sender: 'silasfelinus',
      recipient: 'AMI',
      content: 'Hello, AMI!',
      userId,
      botId,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow creating a chat with an invalid authorization token', () => {
    makeRequest('POST', baseUrl, invalidToken, {
      type: 'ToBot',
      sender: 'silasfelinus',
      recipient: 'AMI',
      content: 'Hello, AMI!',
      userId,
      botId,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include(
        'Authorization token is required or invalid',
      )
    })
  })

  it('Create a new Chat with valid authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        type: 'ToBot',
        sender: 'testtesterton',
        recipient: 'AMI',
        content: 'Hello, AMI!',
        title: 'Greeting',
        channel: 'general',
        isPublic: true,
        isFavorite: false,
        previousEntryId: null,
        originId: null,
        botId,
        recipientId: 1,
        artImageId: null,
        promptId: null,
        botName: 'AMI',
        userId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.be.an('object').that.is.not.empty

      chatId = response.body.data.id
      expect(chatId).to.exist
    })
  })

  it('Get Chat by ID', () => {
    expect(chatId).to.not.eq(null)

    makeRequest('GET', `${baseUrl}/${chatId}`, userToken).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('sender', 'testtesterton')
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

  it('Update Chat with Valid Authentication', () => {
    expect(chatId).to.not.eq(null)

    makeRequest('PATCH', `${baseUrl}/${chatId}`, userToken, {
      content: 'Hello again, AMI!',
      isFavorite: true,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('isFavorite', true)
    })
  })

  it('should not allow deleting a chat without an authorization token', () => {
    expect(chatId).to.not.eq(null)

    makeRequest('DELETE', `${baseUrl}/${chatId}`, null).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('should not allow deleting a chat with an invalid authorization token', () => {
    expect(chatId).to.not.eq(null)

    makeRequest('DELETE', `${baseUrl}/${chatId}`, invalidToken).then(
      (response) => {
        expect(response.status).to.eq(401)
        expect(response.body).to.have.property('success', false)
        expect(response.body.message).to.include('Invalid or expired token')
      },
    )
  })

  it('Delete Chat with Valid Authentication', () => {
    expect(chatId).to.not.eq(null)

    makeRequest('DELETE', `${baseUrl}/${chatId}`, userToken).then(
      (response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body.message).to.include(
          `Communication with ID ${chatId} successfully deleted`,
        )
      },
    )
  })
})
