// cypress/e2e/reactions.cy.ts

describe('Reaction Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let artId: number | undefined
  let reactionId: number | undefined
  const userId = 9 // Example user ID

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
        galleryId: null,
        promptId: null,
        pitchId: null,
        userId,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data?.art).to.have.property('id')
      artId = response.body.data?.art.id
    })
  })

  // Step 2: Attempt to create a reaction without an authorization token
  it('should not allow creating a reaction without an authorization token', () => {
    cy.wrap(artId).should('exist')

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        userId,
        reactionType: 'LOVED',
        reactionCategory: 'ART',
        artId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow creating a reaction with an invalid authorization token', () => {
    cy.wrap(artId).should('exist')

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        userId,
        reactionType: 'LOVED',
        reactionCategory: 'ART',
        artId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Step 3: Create a reaction with valid authentication
  it('Create a New Art Reaction with Authentication', () => {
    cy.wrap(artId).should('exist')

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        userId,
        reactionType: 'LOVED',
        reactionCategory: 'ART',
        artId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
        chatId: null,
        artImageId: null,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data?.reaction).to.have.property('id')
      reactionId = response.body.data?.reaction.id
    })
  })

  // Step 4: Edit the reaction with valid authentication
  it('Edit the Art Reaction with Authentication', () => {
    cy.wrap(reactionId).should('exist')

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        reactionType: 'CLAPPED',
        reactionCategory: 'ART',
        comment: 'Actually, clapping for this artwork!',
        rating: 4,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data?.reaction).to.have.property('rating', 4)
      expect(response.body.data?.reaction.comment).to.eq(
        'Actually, clapping for this artwork!',
      )
    })
  })

  // Step 5: Attempt to delete reaction without authentication
  it('Attempt to Delete Reaction without Authentication (expect failure)', () => {
    cy.wrap(reactionId).should('exist')

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // Step 6: Attempt to delete reaction with invalid token
  it('Attempt to Delete Reaction with Invalid Token (expect failure)', () => {
    cy.wrap(reactionId).should('exist')

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
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

  // Step 7: Delete reaction with valid authentication
  it('Delete the Art Reaction with Authentication', () => {
    cy.wrap(reactionId).should('exist')

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data?.message).to.include(
        `Reaction with ID ${reactionId} deleted successfully`,
      )
    })
  })

  // Step 8: Delete the created art piece with valid authentication
  it('Delete the Created Art Piece with Authentication', () => {
    cy.wrap(artId).should('exist')

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/art/${artId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data?.message).to.include(
        `Art piece with ID ${artId} deleted successfully`,
      )
    })
  })
})
