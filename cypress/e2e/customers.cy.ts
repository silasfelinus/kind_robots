// cypress/e2e/api/customer.cy.ts
 

describe('Customer Management API Tests', () => {
    const baseUrl = 'http://kind-robots.vercel.app/api/customers';
    const apiKey = Cypress.env('API_KEY');
    let customerId: number; // Explicitly define the type as number
  
    it('Create a New Customer', () => {
      cy.request({
        method: 'POST',
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          email: 'john.doe@example.com',
          name: 'John Doe',
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        /* eslint-disable @typescript-eslint/no-unused-expressions */
        expect(response.body.newCustomer).to.be.an('object').that.is.not.empty;
        /* eslint-enable @typescript-eslint/no-unused-expressions */
        customerId = response.body.newCustomer.id; // Ensure the correct ID is captured
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
          .and.have.length.greaterThan(0);
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
        expect(response.body.customer.email).to.eq('john.doe@example.com'); // Expect the correct email
      });
    });
  
    it('Update a Customer by ID', () => {
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${customerId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          name: 'Johnathan Doe',
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
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
          console.log('Reverted Customer ID:', customerId);
        });
      }
    });
  });
  