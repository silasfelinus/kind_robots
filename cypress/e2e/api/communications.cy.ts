// cypress/e2e/communications.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Communication API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/communications'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let communicationId: number
  const userId = 9
  const botId = 1
  const recipientId = 5
  const channelId = 3

  // Helper function to make requests with optional token and body
  const makeRequest = (method: string, url: string, token: string | null, body?: object) => {
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
  it('should not allow creating a communication without an authorization token', () => {
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
      expect(response.body.message).to.include('Authorization token is required')
    })
  })

  it('should not allow creating a communication with an invalid authorization token', () => {
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
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // === CREATION TEST ===
  it('Create a new Communication with valid authentication', () => {
    makeRequest('POST', baseUrl, userToken, {
      type: 'UserToBot',
      sender: 'silasfelinus',
      recipient: 'AMI',
      content: 'Hello, AMI!',
      title: 'Greeting',
      label: 'Introduction',
      isPublic: true,
      isFavorite: false,
      userId,
      botId,
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.communication).to.be.an('object').that.is.not.empty
      communicationId = response.body.data.communication.id
    })
  })

  // === RETRIEVAL TESTS ===
  it('Get Communication by ID', () => {
    makeRequest('GET', `${baseUrl}/${communicationId}`, userToken).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.communication.sender).to.eq('silasfelinus')
    })
  })

  it('Get All Communications', () => {
    makeRequest('GET', baseUrl, userToken).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.communications).to.be.an('array').and.have.length.greaterThan(0)
    })
  })

  it('Get Communications by User ID', () => {
    makeRequest('GET', `${baseUrl}/user/${userId}`, userToken).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.userCommunications).to.be.an('array').and.have.length.greaterThan(0)
    })
  })

  it('Get Communications by Bot ID', () => {
    makeRequest('GET', `${baseUrl}/bot/${botId}`, userToken).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.botCommunications).to.be.an('array').and.have.length.greaterThan(0)
    })
  })

  // === UPDATE TESTS ===
  it('Update Communication with Valid Authentication', () => {
    makeRequest('PATCH', `${baseUrl}/${communicationId}`, userToken, {
      content: 'Hello again, AMI!',
      isFavorite: true,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.communication.isFavorite).to.eq(true)
    })
  })

  // === DELETION TESTS ===
  it('should not allow deleting a communication without an authorization token', () => {
    makeRequest('DELETE', `${baseUrl}/${communicationId}`, null).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include('Authorization token is required')
    })
  })

  it('should not allow deleting a communication with an invalid authorization token', () => {
    makeRequest('DELETE', `${baseUrl}/${communicationId}`, invalidToken).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Delete Communication with Valid Authentication', () => {
    makeRequest('DELETE', `${baseUrl}/${communicationId}`, userToken).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(`Communication with ID ${communicationId} successfully deleted`)
    })
  })
})
