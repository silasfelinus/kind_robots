/* eslint-disable @typescript-eslint/no-unused-expressions */
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
      body: [{
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
      }],
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.milestones).to.be.an('array').that.is.not.empty;
      milestoneId = response.body.milestones[0].id; // Capture correct ID
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
      expect(response.body).to.have.property('milestone'); // Check if 'milestone' exists
      expect(response.body.milestone.label).to.eq('Artist!'); // Correct structure access
      expect(response.body.milestone).to.have.property('isActive');
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
        expect(response.body.milestone.label).to.eq('Master Artist!'); // Correct structure access
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
