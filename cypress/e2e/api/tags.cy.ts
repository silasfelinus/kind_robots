// cypress/e2e/tags.cy.ts

describe('Tag Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/tags'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let tagId: number // Capture tagId for further operations

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
      expect(response.body.data) // Check data array directly, if it's structured like this
        .to.be.an('array')
        .and.have.length.greaterThan(0)
      response.body.data.forEach((tag: Tag) => {
        expect(tag).to.have.all.keys(
          'artImageId',
          'createdAt',
          'flavorText',
          'id',
          'isMature',
          'isPublic',
          'label',
          'pitch',
          'title',
          'updatedAt',
          'userId',
        )
      })
    })
  })

  // Test to create a new tag with valid authentication
  it('Create New Tag with Authentication', () => {
    const uniqueTitle = `Title-${Date.now()}` // Unique title for every test run

    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        label: 'Tag',
        title: uniqueTitle,
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('data').that.is.an('object')

      // Check only for required keys, ignoring others
      const createdTag = response.body.data
      expect(createdTag).to.include.all.keys(
        'id',
        'label',
        'title',
        'userId',
        'createdAt',
        'updatedAt',
      )
      tagId = createdTag.id // Capture created tag ID for further operations
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
      expect(response.body).to.have.property('data').that.is.an('object')
      const updatedTag = response.body.data
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
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
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
        `Tag with ID ${tagId} successfully deleted`,
      )
    })
  })
})
