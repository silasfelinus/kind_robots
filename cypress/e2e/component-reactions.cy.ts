/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('Component Reactions API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/reactions'
  const apiKey = 'your-api-key' // Replace with your actual API key
  let reactionId: number // Store reaction ID for later operations
  const componentId = 3 // Example component ID
  const userId = 1 // Example user ID

  it('Get a Components Reactions', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/component/${componentId}`,
      headers: {
        Accept: 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
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
      body: [{
        userId: userId,
        componentId: componentId,
        isClapped: true,
        title: 'Great Component!',
        reaction: 'Love it',
        comment: 'This component is awesome!',
        reactionType: "Component"
      }],
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      reactionId = response.body.reaction.id // Save reaction ID for later tests
    })
  })

  it('Get Reaction by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${reactionId}`,
      headers: {
        Accept: 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.reaction).to.exist

      const reaction = response.body.reaction
      expect(reaction.id).to.eq(reactionId)
      expect(reaction.componentId).to.eq(componentId)
      expect(reaction.userId).to.eq(userId)
      expect(reaction.isClapped).to.be.true
      expect(reaction.comment).to.eq('This component is awesome!')
    })
  })

  it('Update an Existing Component Reaction', () => {
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
      expect(response.body.success).to.be.true
      expect(response.body.reaction.isBooed).to.be.true
      expect(response.body.reaction.comment).to.eq('Actually, not so sure about this component!')
    })
  })

  it('Delete a Component Reaction', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${reactionId}`,
      headers: {
        Accept: 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
    })
  })
})
