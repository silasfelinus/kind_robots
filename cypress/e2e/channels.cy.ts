// cypress/e2e/channels.cy.ts

describe('Channel Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/channels'
  const apiKey = Cypress.env('API_KEY')
  let channelId: number
  const uniqueLabel = `feed-${Date.now()}`

  it('Create New Channel', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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
        'x-api-key': apiKey,
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
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.channels)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Attempt to Update Channel without Authentication (expect failure)', () => {
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
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Update Channel with Authentication', () => {
    const updatedLabel = `botcafe-${Date.now()}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${channelId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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

  it('Attempt to Delete Channel without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${channelId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Delete Channel with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${channelId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
