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

  after(() => {
    // Safety net: delete the chat if it wasn't cleaned up by the delete test
    // (e.g. the test failed, was skipped, or an earlier assertion threw)
    if (!chatId || !userToken) return

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${chatId}`,
      headers: { Authorization: `Bearer ${userToken}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 404], `chat ${chatId} cleanup`).to.include(res.status)
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
    makeRequest('GET', `${baseUrl}/bots/${botId}`, userToken).then(
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

        chatId = null // signal to after() that cleanup is already done
      },
    )
  })
})
