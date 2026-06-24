// cypress/e2e/api/chats.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  jsonHeaders,
} from '../../support/api-auth'

describe('Chat API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/chats'
  const badJwt = 'definitely-not-valid'
  const botId = 1

  let apiBase = ''
  let setupAuth = ''
  let userJwt = ''
  let userId = 0
  let chatId: number | null = null

  before(() => {
    getApiEnv().then((env) => {
      apiBase = env.apiBase
      setupAuth = env.adminToken
    })

    createLoggedInTestUser().then((auth) => {
      userJwt = auth.token
      userId = auth.id
    })
  })

  after(() => {
    if (chatId && userJwt) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${chatId}`,
        headers: bearerHeaders(userJwt),
        failOnStatusCode: false,
      }).then((res) => {
        expect([200, 404], `chat ${chatId} cleanup`).to.include(res.status)
      })
    }

    deleteTestUser(apiBase, setupAuth, userId)
  })

  const makeRequest = (
    method: string,
    url: string,
    jwt: string | null,
    body?: object,
  ) => {
    return cy.request({
      method,
      url,
      headers: jwt ? bearerHeaders(jwt) : jsonHeaders(),
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
    })
  })

  it('should not allow creating a chat with an invalid authorization token', () => {
    makeRequest('POST', baseUrl, badJwt, {
      type: 'ToBot',
      sender: 'silasfelinus',
      recipient: 'AMI',
      content: 'Hello, AMI!',
      userId,
      botId,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
    })
  })

  it('Create a new Chat with valid authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(userJwt),
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

    makeRequest('GET', `${baseUrl}/${chatId}`, userJwt).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('sender', 'testtesterton')
    })
  })

  it('Get All Chats', () => {
    makeRequest('GET', baseUrl, userJwt).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Get Chats by User ID', () => {
    makeRequest('GET', `${baseUrl}/user/${userId}`, userJwt).then(
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
    makeRequest('GET', `${baseUrl}/bot/${botId}`, userJwt).then(
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

    makeRequest('PATCH', `${baseUrl}/${chatId}`, userJwt, {
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
    })
  })

  it('should not allow deleting a chat with an invalid authorization token', () => {
    expect(chatId).to.not.eq(null)

    makeRequest('DELETE', `${baseUrl}/${chatId}`, badJwt).then(
      (response) => {
        expect(response.status).to.eq(401)
        expect(response.body).to.have.property('success', false)
      },
    )
  })

  it('Delete Chat with Valid Authentication', () => {
    expect(chatId).to.not.eq(null)

    makeRequest('DELETE', `${baseUrl}/${chatId}`, userJwt).then(
      (response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body.message).to.include(
          `Communication with ID ${chatId} successfully deleted`,
        )

        chatId = null
      },
    )
  })
})
