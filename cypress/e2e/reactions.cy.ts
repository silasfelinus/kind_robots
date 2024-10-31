// cypress/e2e/reactions.cy.ts

describe('Reaction Management API Tests with Art Cleanup', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api'
  const apiKey = Cypress.env('API_KEY')
  let artId: number | undefined
  let reactionId: number | undefined
  const userId: number = 9 // Example user ID

  it('Create a New Art Piece', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/art`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        promptString: 'surreal, A beautiful pancake sunrise over the mountains',
        steps: 10,
        path: ' ',
        seed: null,
        channelId: null,
        galleryId: null,
        promptId: null,
        pitchId: null,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      artId = response.body.art.id
    })
  })

  it('Attempt to Create Reaction without Authentication (expect failure)', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        userId,
        reactionType: 'LOVED',
        reactionCategory: 'ART',
        artId,
        comment: 'Love this art!',
        rating: 5,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
    })
  })

  it('Create a New Art Reaction with Authentication', () => {
    cy.wrap(artId).should('exist') // Ensure artId exists

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        userId,
        reactionType: 'LOVED',
        reactionCategory: 'ART',
        artId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      reactionId = response.body.reaction.id
    })
  })

  it('Edit the Art Reaction', () => {
    cy.wrap(reactionId).should('exist') // Ensure reactionId exists

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        reactionType: 'CLAPPED',
        comment: 'Actually, clapping for this artwork!',
        rating: 4,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.reaction).to.have.property('rating', 4)
    })
  })

  it('Attempt to Delete Reaction without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
    })
  })

  it('Delete the Art Reaction with Authentication', () => {
    cy.wrap(reactionId).should('exist') // Ensure reactionId exists

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it('Delete the Created Art Piece with Authentication', () => {
    cy.wrap(artId).should('exist') // Ensure artId exists

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/art/${artId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  // Cleanup in case art or reaction was not removed during tests
  after(() => {
    if (reactionId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/reactions/${reactionId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    }
    if (artId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/art/${artId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    }
  })
})
