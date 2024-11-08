// cypress/e2e/rewards.cy.ts

describe('Reward Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/rewards'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let rewardId: number | undefined // Define with undefined for clarity

  // Step 1: Attempt to create a reward without authentication
  it('should not allow creating a reward without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        icon: 'kind-icon:star',
        text: 'Test Reward Text',
        power: 'Test Power',
        collection: 'Test Collection',
        rarity: 5,
        label: 'Test Label',
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // Step 2: Attempt to create a reward with an invalid token
  it('should not allow creating a reward with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        icon: 'kind-icon:star',
        text: 'Test Reward Text',
        power: 'Test Power',
        collection: 'Test Collection',
        rarity: 5,
        label: 'Test Label',
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Step 3: Create a new reward with valid authentication
  it('Create a New Reward with Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        icon: 'kind-icon:star',
        text: 'Test Reward Text',
        power: 'Test Power',
        collection: 'Test Collection',
        rarity: 5,
        label: 'Test Label',
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.reward).to.be.an('object')
      expect(response.body.reward.label).to.eq('Test Label')
      rewardId = response.body.reward.id
    })
  })

  // Step 4: Attempt to update the reward without authentication
  it('Attempt to Update Reward without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${rewardId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { text: 'Unauthorized Update' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // Step 5: Attempt to update the reward with an invalid token
  it('Attempt to Update Reward with Invalid Token (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: { text: 'Invalid Token Update Attempt' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Step 6: Update the reward with valid authentication
  it('Update Reward with Authentication', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        text: 'Updated Test Reward Text',
        rarity: 10,
        label: 'Updated Test Label',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.label).to.eq('Updated Test Label')
    })
  })

  // Step 7: Retrieve the reward by ID and validate the response
  it('Get Reward by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.reward).to.be.an('object')
      expect(response.body.reward.text).to.eq('Updated Test Reward Text')
    })
  })

  // Step 8: Retrieve all rewards and validate
  it('Get All Rewards', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.be.an('array').and.have.length.greaterThan(0)
    })
  })

  // Step 9: Attempt to delete the reward without authentication
  it('Attempt to Delete Reward without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${rewardId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // Step 10: Attempt to delete the reward with invalid token
  it('Attempt to Delete Reward with Invalid Token (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized with invalid token
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Step 11: Delete the reward with valid authentication
  it('Delete Reward with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(
        `Reward with ID ${rewardId} successfully deleted`,
      )
    })
  })
})
