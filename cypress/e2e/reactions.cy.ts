// cypress/e2e/api/art-reaction.cy.ts

describe('Reaction Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/reactions'
  const apiKey = Cypress.env('API_KEY')
  let reactionId: number | undefined // Updated to include undefined type
  const artId: number = 5 // Example art ID (assuming 5 is valid)
  const userId: number = 1 // Example user ID (assuming 1 is valid)

  it('Get All Art Reactions', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.reactions)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Create a New Art Reaction', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        userId: userId,
        reactionType: 'BOOED', // Use one of the ReactionType enum values
        reactionCategory: 'ART', // Ensure you use the correct category for art
        artId: artId, // Include artId since the category is ART
        comment: 'Not really my favorite',
      },
    }).then((response) => {
      // Log the entire response to debug structure
      cy.log('API Response:', JSON.stringify(response.body))

      // Check the response status
      expect(response.status).to.eq(200)

      // Validate that the response contains a reaction object
      expect(response.body).to.have.property('reaction')
      expect(response.body.reaction).to.have.property('id')

      // Capture the reaction ID for later use
      reactionId = response.body.reaction.id
      expect(reactionId).to.be.a('number')

      console.log('Created Art Reaction ID:', reactionId) // Log for debugging
    })
  })

  it('Edit an Existing Art Reaction', () => {
    // Ensure reactionId is set before proceeding
    cy.wrap(reactionId).should('exist')

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        reactionType: 'LOVED', // Changing the reactionType
        comment: 'Actually, this is growing on me!',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
    })
  })

  it('Delete an Art Reaction', () => {
    // Ensure reactionId is set before proceeding
    cy.wrap(reactionId).should('exist')

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${reactionId}`,
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
