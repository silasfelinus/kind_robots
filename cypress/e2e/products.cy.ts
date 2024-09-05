// cypress/e2e/api/product.cy.ts

describe('Product Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/products'
  const apiKey = Cypress.env('API_KEY')
  let productId: number // Explicitly define the type as number

  it('Create a New Product', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        title: 'Test Product',
        category: 'Test Category',
        flavorText: 'This is a test flavor text',
        description: 'This is a test product description.',
        costInPennies: 999,
        userId: 1,
        passcode: 'testpass',
        imagePath: '/images/test-product.jpg',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(response.body.newProduct).to.be.an('object').that.is.not.empty
      /* eslint-enable @typescript-eslint/no-unused-expressions */
      productId = response.body.newProduct.id // Ensure the correct ID is captured
      console.log('Created Product ID:', productId) // Log for debugging
    })
  })

  it('Get Product by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${productId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.product.title).to.eq('Test Product') // Expect the correct title
    })
  })

  it('Get All Products', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.products)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Update a Product', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${productId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        title: 'Updated Test Product',
        description: 'This is an updated test product description.',
        costInPennies: 1099,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it('Delete a Product', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${productId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  // Ensure all changes are reverted by deleting the product created during the test
  after(() => {
    if (productId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${productId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        console.log('Reverted Product ID:', productId)
      })
    }
  })
})
