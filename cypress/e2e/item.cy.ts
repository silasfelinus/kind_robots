// cypress/e2e/api/cart-item.cy.ts
 

describe('CartItem Management API Tests', () => {
    const baseUrl = 'https://kind-robots.vercel.app/api/cart-item';
    const apiKey = Cypress.env('API_KEY');
    let cartItemId: number; // Explicitly define the type as number
    const cartId: number = 1; // Example cart ID
    const productId: number = 1; // Example product ID
  
    it('Create New CartItem', () => {
      cy.request({
        method: 'POST',
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          cartId,
          productId,
          quantity: 2,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        /* eslint-disable @typescript-eslint/no-unused-expressions */
        expect(response.body.newCartItem).to.be.an('object').that.is.not.empty;
        /* eslint-enable @typescript-eslint/no-unused-expressions */
        cartItemId = response.body.newCartItem.id; // Ensure the correct ID is captured
        console.log('Created CartItem ID:', cartItemId); // Log for debugging
      });
    });
  
    it('Get CartItem by ID', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/id/${cartItemId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.cartItem.productId).to.eq(productId); // Expect the correct product ID
      });
    });
  
    it('Get All CartItems', () => {
      cy.request({
        method: 'GET',
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.cartItems)
          .to.be.an('array')
          .and.have.length.greaterThan(0);
      });
    });
  
    it('Update a CartItem', () => {
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${cartItemId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          quantity: 3,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  
    it('Delete a CartItem', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${cartItemId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  });
  