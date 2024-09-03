// cypress/e2e/api/reward.cy.ts

describe('Reward Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/rewards';
  const apiKey = Cypress.env('API_KEY');
  let rewardId: number; // Explicitly define the type as number

  it('Create a New Reward', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        icon: 'mdi:star',
        text: 'Test Reward Text',
        power: 'Test Power',
        collection: 'Test Collection',
        rarity: 5,
        label: 'Test Label',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      assert.isObject(response.body.reward, 'reward is an object');
      expect(response.body.reward.label).to.eq('Test Label');
      rewardId = response.body.reward.id; // Ensure the correct ID is captured
      console.log('Created Reward ID:', rewardId); // Log for debugging
    });
  });

  it('Get Reward by ID', () => {
    cy.log('Checking reward ID:', rewardId); // Debugging: Log the reward ID
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      failOnStatusCode: false, // Do not fail immediately on status code error
    }).then((response) => {
      cy.log('Response status:', response.status); // Log response status for debugging
      cy.log('Response body:', response.body); // Log response body for debugging

      expect(response.status).to.eq(200);
      expect(response.body.reward).to.be.an('object');
      expect(response.body.reward.text).to.eq('Test Reward Text');
    });
  });

  it('Get All Rewards', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.rewards)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  it('Update a Reward', () => {
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
      expect(response.status).to.eq(200);
      expect(response.body.reward.label).to.eq('Updated Test Label'); // Verify label is updated
    });
  });

  it('Delete a Reward', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  // Ensure all changes are reverted by deleting the reward created during the test
  after(() => {
    if (rewardId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${rewardId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        console.log('Reverted Reward ID:', rewardId);
      });
    }
  });
});
