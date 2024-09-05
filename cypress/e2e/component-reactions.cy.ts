/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/api/component-reaction.cy.ts

describe('Component Reaction Management API Tests', () => {
    const baseUrl = 'https://kind-robots.vercel.app/api/reactions'
    const apiKey = Cypress.env('API_KEY')
    let reactionId: number | undefined // To store the created reaction ID
    const componentId: number = 10 // Example component ID (assuming 10 is valid)
    const userId: number = 1 // Example user ID (assuming 1 is valid)
  
    it('Get All Component Reactions', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/component/${componentId}`,
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
  
    it('Create a New Component Reaction', () => {
      cy.request({
        method: 'POST',
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          userId: userId,
          componentId: componentId,
          isClapped: true,
          title: 'Great Component!',
          reaction: 'Love it',
          comment: 'This component is awesome!',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.newReaction).to.be.an('object').that.is.not.empty
        reactionId = response.body.newReaction.id
        console.log('Created Component Reaction ID:', reactionId) // Log for debugging
      })
    })
  
    it('Edit an Existing Component Reaction', () => {
      if (reactionId) {
        cy.request({
          method: 'PATCH',
          url: `${baseUrl}/${reactionId}`,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: {
            isBooed: true,
            comment: 'Actually, not so sure about this component!',
          },
        }).then((response) => {
          expect(response.status).to.eq(200)
        })
      } else {
        throw new Error('reactionId is not defined. Cannot perform PATCH request.')
      }
    })
  
    it('Delete a Component Reaction', () => {
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
        throw new Error('reactionId is not defined. Cannot perform DELETE request.')
      }
    })
  
    after(() => {
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
          console.log('Reverted Component Reaction ID:', reactionId)
        })
      } else {
        console.log('No reactionId to delete.')
      }
    })
  })
  