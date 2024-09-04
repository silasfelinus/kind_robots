// cypress/e2e/api/cart.cy.ts

describe('Cart Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/carts';
  const apiKey = Cypress.env('API_KEY');
  let cartId: number; // Explicitly define the type as number

  it('Create New Cart', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        customerId: 1,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(response.body.newCart).to.be.an('object').that.is.not.empty;
      /* eslint-enable @typescript-eslint/no-unused-expressions */
      cartId = response.body.newCart.id; // Ensure the correct ID is captured
      console.log('Created Cart ID:', cartId); // Log for debugging
    });
  });

  it('Get Cart by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/id/${cartId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.cart.customerId).to.eq(1); // Expect the correct customer ID
    });
  });

  it('Get All Carts', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.carts)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  it('Update a Cart', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${cartId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        customerId: 2,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.cart.customerId).to.eq(2); // Confirm the update was successful
    });
  });

  it('Delete a Cart', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${cartId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });
});
