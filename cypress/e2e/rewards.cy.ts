// cypress/e2e/rewards.cy.ts

describe('Reward Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/rewards'
  const apiKey = Cypress.env('API_KEY')
  let rewardId: number // Store reward ID for further operations

  it('Create a New Reward', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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

  it('Attempt to Update Reward without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        text: 'Unauthorized Update',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Update Reward with Authentication', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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

  it('Get Reward by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.reward).to.be.an('object')
      expect(response.body.reward.text).to.eq('Updated Test Reward Text')
    })
  })

  it('Get All Rewards', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.rewards)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Attempt to Delete Reward without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Delete Reward with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  // Ensure cleanup: Delete reward after tests if it wasn't removed
  after(() => {
    if (rewardId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${rewardId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    }
  })
})
