// cypress/e2e/reactions.cy.ts

describe('Reaction Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api'
  const userToken = Cypress.env('USER_TOKEN')
  let artId: number | undefined
  let reactionId: number | undefined
  const userId: number = 9 // Example user ID

  // Step 1: Create a new art piece
  it('Create a New Art Piece', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/art`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
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
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      artId = response.body.art.id
    })
  })

  // Step 2: Create a New Reaction
  it('Create a New Art Reaction', () => {
    cy.wrap(artId).should('exist') // Ensure artId exists

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        userId,
        reactionType: 'LOVED',
        reactionCategory: 'ART',
        artId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
        channelId: null,
        chatExchangeId: null,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      reactionId = response.body.reaction.id
    })
  })

  // Step 3: Edit the Reaction
  it('Edit the Art Reaction with Authentication', () => {
    cy.wrap(reactionId).should('exist') // Ensure reactionId exists

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
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

  // Step 4: Attempt to Delete Reaction without Authentication
  it('Attempt to Delete Reaction without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })
  })

  // Step 5: Delete Reaction with Authentication
  it('Delete the Art Reaction with Authentication', () => {
    cy.wrap(reactionId).should('exist') // Ensure reactionId exists

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  // Step 6: Delete the Created Art Piece with Authentication
  it('Delete the Created Art Piece with Authentication', () => {
    cy.wrap(artId).should('exist') // Ensure artId exists

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/art/${artId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
