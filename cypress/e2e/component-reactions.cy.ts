/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/component-reactions.cy.ts

describe('Component Reactions API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let componentId: number | undefined
  let reactionId: number | undefined
  const userId: number = 9

  // Step 1: Create a new component before the tests
  before(() => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/components`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        folderName: 'test-folder',
        componentName: `TestComponent_${Date.now()}`,
        isWorking: true,
        underConstruction: false,
        isBroken: false,
        title: 'Test Component',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      componentId = response.body.component.id
      expect(componentId).to.be.a('number')
    })
  })

  // Step 2: Create a new reaction for the created component
  it('Create a New Component Reaction', () => {
    cy.wrap(componentId).should('exist')

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        userId,
        reactionType: 'CLAPPED',
        reactionCategory: 'COMPONENT',
        componentId,
        comment: 'Great job on this component!',
        rating: 4,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      reactionId = response.body.reaction.id
      expect(reactionId).to.be.a('number')
    })
  })

  // Step 3: Fetch all reactions for the component
  it("Get a Component's Reactions", () => {
    cy.wrap(componentId).should('exist')

    cy.request({
      method: 'GET',
      url: `${baseUrl}/reactions/component/${componentId}`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.reactions)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // Step 4: Fetch a reaction by ID
  it('Get Reaction by ID', () => {
    cy.wrap(reactionId).should('exist')

    cy.request({
      method: 'GET',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      const reaction = response.body.reaction
      expect(reaction.id).to.eq(reactionId)
      expect(reaction.componentId).to.eq(componentId)
      expect(reaction.userId).to.eq(userId)
      expect(reaction.comment).to.eq('Great job on this component!')
      expect(reaction.rating).to.eq(4)
    })
  })

  // Step 5: Update the reaction
  it('Update an Existing Component Reaction with Valid and Invalid Authentication', () => {
    cy.wrap(reactionId).should('exist')

    // Attempt update without token
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        reactionType: 'BOOED',
        comment: 'Actually, I have second thoughts...',
        rating: 2,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })

    // Attempt update with invalid token
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        reactionType: 'BOOED',
        comment: 'Actually, I have second thoughts...',
        rating: 2,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized with invalid token
    })

    // Attempt update with valid token
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        reactionType: 'BOOED',
        comment: 'Actually, I have second thoughts...',
        rating: 2,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.reaction.reactionType).to.eq('BOOED')
      expect(response.body.reaction.comment).to.eq(
        'Actually, I have second thoughts...',
      )
      expect(response.body.reaction.rating).to.eq(2)
    })
  })

  // Step 6: Delete the reaction
  it('Delete a Component Reaction with Valid and Invalid Authentication', () => {
    cy.wrap(reactionId).should('exist')

    // Attempt delete without token
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        Accept: 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })

    // Attempt delete with invalid token
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized with invalid token
    })

    // Attempt delete with valid token
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
    })
  })

  // Step 7: Delete the created component
  after(() => {
    cy.wrap(componentId).should('exist')

    // Delete component with valid token
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/components/${componentId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
    })
  })
})
