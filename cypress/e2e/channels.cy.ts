// cypress/e2e/channels.cy.ts

describe('Channel Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/channels'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let channelId: number
  const uniqueLabel = `feed-${Date.now()}`

  it('should not allow creating a new channel without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        userId: 9,
        label: uniqueLabel,
        description: 'global feed',
        title: 'Global Feed',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Authorization token is required')
    })
  })

  it('should not allow creating a new channel with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        userId: 9,
        label: uniqueLabel,
        description: 'global feed',
        title: 'Global Feed',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create New Channel with Valid Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        userId: 9,
        label: uniqueLabel,
        description: 'global feed',
        title: 'Global Feed',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.newChannel).to.be.an('object')
      channelId = response.body.newChannel.id
    })
  })

  it('Get Channel by ID with Messages', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${channelId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.channel.label).to.eq(uniqueLabel)
      expect(response.body.messages).to.be.an('array')
    })
  })

  it('Get All Channels', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.channels)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('should not allow updating a channel without an authorization token', () => {
    const updatedLabel = `botcafe-${Date.now()}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${channelId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        label: updatedLabel,
        description: 'global botchat',
        title: 'Bot Cafe',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow updating a channel with an invalid authorization token', () => {
    const updatedLabel = `botcafe-${Date.now()}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${channelId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        label: updatedLabel,
        description: 'global botchat',
        title: 'Bot Cafe',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Update Channel with Valid Authentication', () => {
    const updatedLabel = `botcafe-${Date.now()}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${channelId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        label: updatedLabel,
        description: 'global botchat',
        title: 'Bot Cafe',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.updatedChannel).to.include({
        label: updatedLabel,
        description: 'global botchat',
        title: 'Bot Cafe',
      })
    })
  })

  it('should not allow deleting a channel without an authorization token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${channelId}`,
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

  it('should not allow deleting a channel with an invalid authorization token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${channelId}`,
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

  it('Delete Channel with Valid Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${channelId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
