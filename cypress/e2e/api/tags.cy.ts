// cypress/e2e/tags.cy.js

describe('Tag Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/tags'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let tagId: number // Define tagId for further operations

  // Test to get all tags
  it('Get All Tags', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.tags)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // Test to create a new tag with valid authentication
  it('Create New Tag with Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        label: 'Tag',
        title: 'Abstract Art',
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.tag).to.be.an('object')
      tagId = response.body.tag.id // Capture created tag ID for future operations
    })
  })

  // Attempt to edit the tag without authentication
  it('Attempt to Edit Tag without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${tagId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        label: 'art',
        title: 'Modern Art',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // Attempt to edit the tag with an invalid token
  it('Attempt to Edit Tag with Invalid Token (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${tagId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        label: 'art',
        title: 'Modern Art',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized with invalid token
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Edit the tag with valid authentication
  it('Edit Tag with Authentication', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${tagId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        label: 'art',
        title: 'Modern Art',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      const updatedTag = response.body.tag
      expect(updatedTag).to.have.property('id', tagId)
      expect(updatedTag).to.have.property('label', 'art')
      expect(updatedTag).to.have.property('title', 'Modern Art')
    })
  })

  // Attempt to delete the tag without authentication
  it('Attempt to Delete Tag without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${tagId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // Attempt to delete the tag with an invalid token
  it('Attempt to Delete Tag with Invalid Token (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${tagId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized with invalid token
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Delete the tag with valid authentication
  it('Delete Tag with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${tagId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(
        `Tag with ID ${tagId} deleted successfully`,
      )
    })
  })
})
