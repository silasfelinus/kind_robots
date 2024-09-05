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
        artId: artId,
        claps: 0,
        boos: 5,
        title: 'hmmm!',
        reaction: 'skeptical',
        comment: 'not sure here',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(response.body.newReaction).to.be.an('object').that.is.not.empty
      reactionId = response.body.newReaction.id // Ensure the correct ID is captured
      console.log('Created Art Reaction ID:', reactionId) // Log for debugging
    })
  })

  it('Edit an Existing Art Reaction', () => {
    if (reactionId) {
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${reactionId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          claps: 10,
          comment: 'Still loving this art!',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    } else {
      throw new Error(
        'reactionId is not defined. Cannot perform PATCH request.',
      )
    }
  })

  it('Delete an Art Reaction', () => {
    if (reactionId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${reactionId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    } else {
      throw new Error(
        'reactionId is not defined. Cannot perform DELETE request.',
      )
    }
  })

  // Ensure all changes are reverted by deleting all reactions made during the test
  after(() => {
    if (reactionId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${reactionId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      })
        .then((response) => {
          expect(response.status).to.eq(200)
          console.log('Reverted Art Reaction ID:', reactionId)
        })
        .then((response) => {
          if (response.status !== 200) {
            console.log('Failed to delete Art Reaction with ID:', reactionId)
          } else {
            console.log('Reverted Art Reaction ID:', reactionId)
          }
        })
    } else {
      console.log('No reactionId to delete.')
    }
  })
})
