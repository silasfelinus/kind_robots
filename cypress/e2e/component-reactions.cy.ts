/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/component-reactions.cy.ts

describe('Component Reactions API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api'
  const apiKey = Cypress.env('API_KEY')
  let componentId: number | undefined
  let reactionId: number | undefined
  const userId: number = 9 // Example user ID

  // Step 1: Create a new component before the tests
  before(() => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/components`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        folderName: 'test-folder',
        componentName: `TestComponent_${Date.now()}`, // Unique component name
        isWorking: true,
        underConstruction: false,
        isBroken: false,
        title: 'Test Component',
      },
    }).then((response) => {
      cy.log('Component Creation Response:', JSON.stringify(response.body))

      // Check the response status and capture the componentId
      expect(response.status).to.eq(200)
      expect(response.body.component).to.have.property('id')

      componentId = response.body.component.id
      expect(componentId).to.be.a('number')

      console.log('Created Component ID:', componentId) // Log for debugging
    })
  })

  // Step 2: Create a new reaction for the created component
  it('Create a New Component Reaction', () => {
    cy.wrap(componentId).should('exist') // Ensure componentId exists

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        userId: userId,
        reactionType: 'CLAPPED', // Example reaction type
        reactionCategory: 'COMPONENT',
        componentId: componentId, // Use created componentId
        comment: 'Great job on this component!',
        rating: 4, // Example rating
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

  // Step 3: Fetch all reactions for the component
  it("Get a Component's Reactions", () => {
    cy.wrap(componentId).should('exist') // Ensure componentId exists

    cy.request({
      method: 'GET',
      url: `${baseUrl}/reactions/component/${componentId}`,
      headers: {
        Accept: 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.reactions)
        .to.be.an('array')
        .and.have.length.greaterThan(0) // Check reactions returned
    })
  })

  // Step 4: Fetch a reaction by ID
  it('Get Reaction by ID', () => {
    cy.wrap(reactionId).should('exist') // Ensure reactionId exists

    cy.request({
      method: 'GET',
      url: `${baseUrl}/reactions/${reactionId}`,
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
      expect(reaction.comment).to.eq('Great job on this component!')
      expect(reaction.rating).to.eq(4)
    })
  })

  // Step 5: Update the reaction
  it('Update an Existing Component Reaction', () => {
    cy.wrap(reactionId).should('exist') // Ensure reactionId exists

    // Attempt update without API key (expect failure)
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        reactionType: 'BOOED',
        comment: 'Actually, I have second thoughts...',
        reactionCategory: 'COMPONENT',
        rating: 2,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Expect forbidden status without API key
    })

    // Attempt update with API key (expect success)
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        reactionType: 'BOOED',
        comment: 'Actually, I have second thoughts...',
        reactionCategory: 'COMPONENT',
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
  it('Delete a Component Reaction', () => {
    cy.wrap(reactionId).should('exist') // Ensure reactionId exists

    // Attempt delete without API key (expect failure)
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        Accept: 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Expect forbidden status without API key
    })

    // Attempt delete with API key (expect success)
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        Accept: 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
    })
  })

  // Step 7: Delete the created component
  after(() => {
    cy.wrap(componentId).should('exist') // Ensure componentId exists

    // Attempt delete without API key (expect failure)
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/components/${componentId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Expect forbidden status without API key
    })

    // Attempt delete with API key (expect success)
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/components/${componentId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
    })
  })
})
