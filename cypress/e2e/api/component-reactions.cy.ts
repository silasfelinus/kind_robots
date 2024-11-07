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
      expect(response.body).to.have.property('success', true)
      componentId = response.body.data.component.id
      expect(componentId).to.be.a('number')
    })
  })

  // Step 2: Attempt to create a reaction with various authentication scenarios
  it('should not allow creating a component reaction without an authorization token', () => {
    cy.wrap(componentId).should('exist')

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        userId,
        reactionType: 'CLAPPED',
        reactionCategory: 'COMPONENT',
        componentId,
        comment: 'Great job on this component!',
        rating: 4,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow creating a component reaction with an invalid authorization token', () => {
    cy.wrap(componentId).should('exist')

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        userId,
        reactionType: 'CLAPPED',
        reactionCategory: 'COMPONENT',
        componentId,
        comment: 'Great job on this component!',
        rating: 4,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create a New Component Reaction with Valid Authentication', () => {
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
        chatId: null,
        artImageId: null,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      reactionId = response.body.data.reaction.id
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
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.reactions)
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
      expect(response.body).to.have.property('success', true)
      const reaction = response.body.data.reaction
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
      expect(response.body).to.have.property('success', false)
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
      expect(response.body).to.have.property('success', false)
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
        reactionCategory: 'COMPONENT',
        comment: 'Actually, I have second thoughts...',
        rating: 2,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.reaction.reactionType).to.eq('BOOED')
      expect(response.body.data.reaction.comment).to.eq(
        'Actually, I have second thoughts...',
      )
      expect(response.body.data.reaction.rating).to.eq(2)
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
      expect(response.body).to.have.property('success', false)
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
      expect(response.body).to.have.property('success', false)
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
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.message).to.include(
        `Reaction with ID ${reactionId} successfully deleted.`,
      )
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
      expect(response.body).to.have.property('success', true)
    })
  })
})
