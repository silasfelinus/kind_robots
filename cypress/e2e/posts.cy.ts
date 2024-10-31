// cypress/e2e/api/posts.cy.ts

describe('Post Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/posts'
  const apiKey = Cypress.env('API_KEY')
  let postId: number | undefined // Define with undefined for clarity
  const userId: number = 9

  before(() => {
    // Create a post once before running tests
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        userId,
        username: 'silasfelinus',
        content: 'This is a test post content.',
        title: 'Test Post Title',
        label: 'General',
        imagePath: '/images/test-post.jpg',
        isFavorite: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      postId = response.body.post.id
    })
  })

  it('Attempt to Update Post without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${postId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { title: 'Unauthorized Update' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Update Post with Authentication', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${postId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        title: 'Updated Test Post Title',
        content: 'This is updated test post content.',
        label: 'Updated Label',
        isFavorite: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.post.title).to.eq('Updated Test Post Title')
      expect(response.body.post.content).to.eq(
        'This is updated test post content.',
      )
    })
  })

  it('Get Post by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${postId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.post.title).to.eq('Updated Test Post Title')
    })
  })

  it('Get All Posts', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.posts)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Attempt to Delete Post without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${postId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Delete Post with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${postId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  // Cleanup: Ensure deletion if post wasn't removed during tests
  after(() => {
    if (postId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${postId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    }
  })
})
