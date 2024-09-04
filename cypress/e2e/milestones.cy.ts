// cypress/e2e/api/milestone.cy.ts

describe('Milestone Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/milestones';
  const apiKey = Cypress.env('API_KEY');
  let milestoneId: number; // Explicitly define the type as number

  it('Get All Milestones', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.milestones)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  it('Create a New Milestone', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        label: 'Artist!',
        message: 'You made Art!',
        triggerCode: 'Artist',
        icon: 'mdi:palette',
        karma: 10,
        isRepeatable: true,
        tooltip: 'Make new Art for our Art Modeler',
        isActive: true,
        pageHint: '/artmaker',
        subtleHint: 'Go press some buttons in the art room',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(response.body.milestone).to.be.an('array').that.is.not.empty;
      /* eslint-enable @typescript-eslint/no-unused-expressions */
      milestoneId = response.body.newMilestones[0].id; // Ensure the correct ID is captured
      console.log('Created Milestone ID:', milestoneId); // Log for debugging
    });
  });

  it('Get Milestone by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${milestoneId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.milestone.label).to.eq('Artist!'); // Expect the correct label
    });
  });

  it('Update a Milestone', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${milestoneId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        label: 'Master Artist!',
        message: 'You created a masterpiece!',
        karma: 20,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      // Verify the update
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${milestoneId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.milestone.label).to.eq('Master Artist!');
        expect(response.body.milestone.message).to.eq('You created a masterpiece!');
        expect(response.body.milestone.karma).to.eq(20);
      });
    });
  });

  it('Delete a Milestone', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${milestoneId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  // Ensure all changes are reverted by deleting the milestone created during the test
  after(() => {
    if (milestoneId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${milestoneId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        console.log('Reverted Milestone ID:', milestoneId);
      });
    }
  });
});
