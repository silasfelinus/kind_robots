// cypress/e2e/api/milestone-record.cy.ts

/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Milestone Record Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/milestones/records';
  const registerUrl = 'https://kind-robots.vercel.app/api/users/register';
  const userUrl = 'https://kind-robots.vercel.app/api/users/';
  const deleteUrl = 'https://kind-robots.vercel.app/api/milestones/records';
  const apiKey = Cypress.env('API_KEY');
  
  let milestoneRecordId: number;
  let userId: number;
  const milestoneId: number = 1; // Example milestone ID (assuming 1 is valid)
  const newUserName = `testuser-${Date.now()}`; // Generate unique username using Date.now()

  it('Create a New User', () => {
    cy.request({
      method: 'POST',
      url: registerUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        username: newUserName,
        email: `${newUserName}@example.com`,
        password: 'password123',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.user).to.be.an('object').that.is.not.empty;
      userId = response.body.user.id; // Capture the newly created user ID
      console.log('Created User ID:', userId); // Log for debugging
    });
  });

  it('Create a New Milestone Record for the New User', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        userId: userId,
        milestoneId: milestoneId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.record).to.be.an('object').that.is.not.empty;
      milestoneRecordId = response.body.record.id; // Ensure the correct Milestone Record ID is captured
      console.log('Created Milestone Record ID:', milestoneRecordId); // Log for debugging
    });
  });

  it('Delete the Milestone Record', () => {
    cy.request({
      method: 'DELETE',
      url: `${deleteUrl}/${milestoneRecordId}`, // Use updated delete URL
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      failOnStatusCode: false, // Allow Cypress to log the response even if it fails
    }).then((response) => {
      if (response.status !== 200) {
        console.error('Failed to delete milestone record:', response.body); // Log error details
      }
      expect(response.status).to.eq(200);
    });
  });

  // Clean up: Ensure the newly created user is deleted after the tests
  after(() => {
    if (userId) {
      cy.request({
        method: 'DELETE',
        url: `${userUrl}/${userId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        console.log('Deleted User ID:', userId); // Log for debugging
      });
    }
  });
});
