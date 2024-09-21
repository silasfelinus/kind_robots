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
        promptString: 'goth kitten', // Example prompt for creating art
      },
    }).then((response) => {
      // Log the entire response to debug structure
      cy.log('Art Creation Response:', JSON.stringify(response.body))

      // Check the response status and capture the artId
      expect(response.status).to.eq(200)
      expect(response.body.art).to.have.property('id')

      artId = response.body.art.id
      expect(artId).to.be.a('number')

      console.log('Created Art ID:', artId) // Log for debugging
    })
  })

  it('Create a New Art Reaction', () => {
    cy.wrap(artId).should('exist') // Ensure the artId exists before creating a reaction

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
        artId: artId, // Use the created artId
        comment: 'Love this goth kitten art!',
      },
    }).then((response) => {
      // Log the entire response to debug structure
      cy.log('Reaction Creation Response:', JSON.stringify(response.body))

      // Check the response status and capture the reactionId
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('reaction')
      reactionId = response.body.reaction.id
      expect(reactionId).to.be.a('number')

      console.log('Created Reaction ID:', reactionId) // Log for debugging
    })
  })

  it('Edit the Existing Art Reaction', () => {
    cy.wrap(reactionId).should('exist') // Ensure the reactionId exists before editing

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        reactionType: 'CLAPPED', // Changing the reaction type
        comment: 'Actually, clapping for this artwork!',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
    })
  })

  it('Delete the Art Reaction', () => {
    cy.wrap(reactionId).should('exist') // Ensure the reactionId exists before deleting

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
    cy.wrap(artId).should('exist') // Ensure the artId exists before deleting

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
