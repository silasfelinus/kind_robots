// cypress/e2e/api/art-reaction.cy.ts

describe('Reaction Management API Tests with Art Cleanup', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api'
  const apiKey = Cypress.env('API_KEY')
  let artId: number | undefined
  let reactionId: number | undefined
  const userId: number = 1 // Example user ID (assuming 1 is valid)

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
      cy.log('Art Creation Response:', JSON.stringify(response.body))

      // Check response and capture artId
      expect(response.status).to.eq(200)
      expect(response.body.art).to.have.property('id')

      artId = response.body.art.id
      expect(artId).to.be.a('number')

      console.log('Created Art ID:', artId)
    })
  })

  it('Create a New Art Reaction', () => {
    cy.wrap(artId).should('exist') // Ensure artId exists

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        userId: userId,
        reactionType: 'LOVED', // Example reaction type
        reactionCategory: 'ART',
        artId: artId, // Use created artId
        comment: 'Love this pancake sunrise art!',
        rating: 5, // Example rating
      },
    }).then((response) => {
      cy.log('Reaction Creation Response:', JSON.stringify(response.body))

      // Check response and capture reactionId
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('reaction')
      reactionId = response.body.reaction.id
      expect(reactionId).to.be.a('number')

      console.log('Created Reaction ID:', reactionId)
    })
  })

  it('Edit the Existing Art Reaction', () => {
    cy.wrap(reactionId).should('exist') // Ensure reactionId exists

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        reactionType: 'CLAPPED', // Changing reaction type
        comment: 'Actually, clapping for this artwork!',
        reactionCategory: 'ART',
        rating: 4, // Updating the rating
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.reaction).to.have.property('rating', 4)
    })
  })

  it('Delete the Art Reaction', () => {
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
      expect(response.body).to.have.property('success', true)
    })
  })

  it('Delete the Created Art Piece', () => {
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
      expect(response.body).to.have.property('success', true)
    })
  })
})
