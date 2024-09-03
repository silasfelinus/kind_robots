// cypress/e2e/api/milestone-record.cy.ts

describe('Milestone Record Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.org/api/milestones/records';
  const apiKey = Cypress.env('API_KEY');
  let milestoneRecordId: number; // Explicitly define the type as number
  const milestoneId: number = 1; // Example milestone ID (assuming 1 is valid)
  const userId: number = 1; // Example user ID (assuming 1 is valid)

  it('Get All Milestone Records', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.records)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  it('Get Milestone Records for User', () => {
    cy.request({
      method: 'GET',
      url: `https://kind-robots.vercel.org/api/users/${userId}/milestones`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.records)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  it('Create a New Milestone Record', () => {
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
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(response.body.newRecord).to.be.an('object').that.is.not.empty;
      /* eslint-enable @typescript-eslint/no-unused-expressions */
      milestoneRecordId = response.body.newRecord.id; // Ensure the correct ID is captured
      console.log('Created Milestone Record ID:', milestoneRecordId); // Log for debugging
    });
  });

  it('Update a Milestone Record', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${milestoneRecordId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        username: 'UpdatedUser',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      // Verify the update
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${milestoneRecordId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.record.username).to.eq('UpdatedUser'); // Check updated username
      });
    });
  });

  it('Delete a Milestone Record', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${milestoneRecordId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  // Ensure all changes are reverted by deleting the record created during the test
  after(() => {
    if (milestoneRecordId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${milestoneRecordId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        console.log('Reverted Milestone Record ID:', milestoneRecordId);
      });
    }
  });
});
