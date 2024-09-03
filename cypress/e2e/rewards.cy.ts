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
        /* eslint-disable @typescript-eslint/no-unused-expressions */
        expect(response.body.newReward).to.be.an('object').that.is.not.empty;
        /* eslint-enable @typescript-eslint/no-unused-expressions */
        rewardId = response.body.newReward.id; // Ensure the correct ID is captured
        console.log('Created Reward ID:', rewardId); // Log for debugging
      });
    });
  
    it('Get Reward by ID', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${rewardId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.reward.text).to.eq('Test Reward Text'); // Expect the correct text
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
  