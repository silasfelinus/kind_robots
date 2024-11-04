// cypress/e2e/api/posts.cy.ts

describe('Post Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/posts'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let postId: number // Define postId for storing created post ID
  const userId = 9
  const uniquePostTitle = `Test Post Title - ${Date.now()}`

  // Step 1: Attempt to create a post with various authentication scenarios

  it('should not allow creating a post without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        userId,
        username: 'silasfelinus',
        content: 'This is a test post content.',
        title: uniquePostTitle,
        label: 'General',
        imagePath: '/images/test-post.jpg',
        isFavorite: true,
        botId: null,
        channelId: null,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow creating a post with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        userId,
        username: 'silasfelinus',
        content: 'This is a test post content.',
        title: uniquePostTitle,
        label: 'General',
        imagePath: '/images/test-post.jpg',
        isFavorite: true,
        botId: null,
        channelId: null,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create a New Post with Valid Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        userId,
        username: 'silasfelinus',
        content: 'This is a test post content.',
        title: uniquePostTitle,
        label: 'General',
        imagePath: '/images/test-post.jpg',
        isFavorite: true,
        botId: null,
        channelId: null,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      postId = response.body.post.id
    })
  })

  // Step 2: Attempt to update post without authentication
  it('Attempt to Update Post without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${postId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { title: 'Unauthorized Update' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // Step 3: Attempt to update post with invalid token
  it('Attempt to Update Post with Invalid Token (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${postId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: { title: 'Invalid Update Attempt' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Step 4: Update post with valid authentication
  it('Update Post with Authentication', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${postId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
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
      expect(response.body.post.label).to.eq('Updated Label')
    })
  })

  // Step 5: Retrieve post by ID
  it('Get Post by ID', () => {
    cy.wrap(postId).should('exist') // Ensure postId exists
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${postId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.post.title).to.eq('Updated Test Post Title')
    })
  })

  // Step 6: Retrieve all posts
  it('Get All Posts', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.posts)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // Step 7: Attempt to delete post without authentication
  it('Attempt to Delete Post without Authentication (expect failure)', () => {
    cy.wrap(postId).should('exist') // Ensure postId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${postId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // Step 8: Attempt to delete post with invalid token
  it('Attempt to Delete Post with Invalid Token (expect failure)', () => {
    cy.wrap(postId).should('exist') // Ensure postId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${postId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Step 9: Delete post with valid authentication
  it('Delete Post with Authentication', () => {
    cy.wrap(postId).should('exist') // Ensure postId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${postId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.message).to.include(
        `Post with ID ${postId} successfully deleted`,
      )
    })
  })
})
