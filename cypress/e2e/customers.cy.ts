/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/api/customer.cy.ts

describe('Customer Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/customers';
  const apiKey = Cypress.env('API_KEY');
  let customerId: number; // Explicitly define the type as number

  it('Create a New Customer', () => {
    const uniqueEmail = `john.doe${Date.now()}@example.com`; // Generate a unique email using Date.now
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        email: uniqueEmail, // Use the unique email
        name: 'John Doe',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.newCustomer).to.be.an('object').that.is.not.empty;
      customerId = response.body.newCustomer.id; // Capture the customer ID
      console.log('Created Customer ID:', customerId); // Log for debugging
    });
  });

  it('Get All Customers', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.customers)
        .to.be.an('array')
        .and.have.length.greaterThan(0); // Ensure the customers array is not empty
    });
  });

  it('Get Customer by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${customerId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.customer.email).to.match(/john.doe\d+@example.com/); // Check if the correct email format is returned
    });
  });

  it('Update a Customer by ID', () => {
    const updatedName = 'Johnathan Doe';
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${customerId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        name: updatedName,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      // Log the entire response body for debugging
      cy.log(JSON.stringify(response.body));
  
      // Verify the update
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${customerId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((getResponse) => {
        expect(getResponse.status).to.eq(200);
        cy.log(JSON.stringify(getResponse.body)); // Log the GET response body
  
        // Check if `updatedCustomer` exists and contains the `name`
        expect(getResponse.body).to.have.property('customer');
        expect(getResponse.body.customer).to.have.property('name', updatedName); // Check updated name
      });
    });
  });
  

  it('Delete a Customer by ID', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${customerId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  // Ensure all changes are reverted by deleting the customer created during the test
  after(() => {
    if (customerId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${customerId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        console.log('Reverted Customer ID:', customerId); // Log for debugging
      });
    }
  });
});
