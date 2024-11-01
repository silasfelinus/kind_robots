// cypress/e2e/rewards.cy.ts

describe('Reward Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/rewards'
  const userToken = Cypress.env('USER_TOKEN')
  let rewardId: number | undefined // Define with undefined for clarity

  // Step 1: Create a new reward with valid authentication
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
      expect(response.status).to.eq(200)
      expect(response.body.reward).to.be.an('object')
      expect(response.body.reward.label).to.eq('Test Label')
      rewardId = response.body.reward.id
    })
  })

  // Step 2: Attempt to update the reward without authentication
  it('Attempt to Update Reward without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${rewardId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { text: 'Unauthorized Update' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })
  })

  // Step 3: Update the reward with valid authentication
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
      expect(response.body.reward.label).to.eq('Updated Test Label')
    })
  })

  // Step 4: Retrieve the reward by ID and validate the response
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
      expect(response.body.reward).to.be.an('object')
      expect(response.body.reward.text).to.eq('Updated Test Reward Text')
    })
  })

  // Step 5: Retrieve all rewards and validate
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
      expect(response.body.rewards)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // Step 6: Attempt to delete the reward without authentication
  it('Attempt to Delete Reward without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${rewardId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })
  })

  // Step 7: Delete the reward with valid authentication
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
    })
  })

  // Cleanup: Ensure deletion of reward if not removed during tests
  after(() => {
    if (rewardId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${rewardId}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    }
  })
})
