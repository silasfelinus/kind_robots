// cypress/e2e/resources.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Resource Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/resources'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let resourceId: number | undefined
  const uniqueResourceName = `Resource-${Date.now()}`

  // Step 1: Attempt to create resource with missing and invalid tokens
  it('should not allow creating a resource without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        userId: 9,
        name: uniqueResourceName,
        customLabel: 'Custom Label',
        MediaPath: '/media/test-resource.jpg',
        customUrl: 'https://custom-url.com',
        civitaiUrl: 'https://civitai-url.com',
        huggingUrl: 'https://huggingface-url.com',
        localPath: '/local/test-resource',
        description: 'This is a test resource description.',
        resourceType: 'URL',
        isMature: false,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow creating a resource with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        userId: 9,
        name: uniqueResourceName,
        customLabel: 'Custom Label',
        MediaPath: '/media/test-resource.jpg',
        customUrl: 'https://custom-url.com',
        civitaiUrl: 'https://civitai-url.com',
        huggingUrl: 'https://huggingface-url.com',
        localPath: '/local/test-resource',
        description: 'This is a test resource description.',
        resourceType: 'URL',
        isMature: false,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Step 2: Create a new resource with valid authentication
  it('Create a New Resource with Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        userId: 9,
        name: uniqueResourceName,
        customLabel: 'Custom Label',
        MediaPath: '/media/test-resource.jpg',
        customUrl: 'https://custom-url.com',
        civitaiUrl: 'https://civitai-url.com',
        huggingUrl: 'https://huggingface-url.com',
        localPath: '/local/test-resource',
        description: 'This is a test resource description.',
        resourceType: 'URL',
        isMature: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.be.an('object').that.is.not.empty
      resourceId = response.body.data.id
    })
  })

  // Step 3: Attempt to update resource without authentication
  it('Attempt to Update Resource without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${resourceId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        name: 'Unauthorized Update Attempt',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // Step 4: Attempt to update resource with invalid token
  it('Attempt to Update Resource with Invalid Token (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${resourceId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        name: 'Invalid Token Update Attempt',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Step 5: Update resource with valid authentication
  it('Update Resource with Authentication', () => {
    const updatedResourceName = `Updated-${uniqueResourceName}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${resourceId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        name: updatedResourceName,
        description: 'This is an updated test resource description.',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.name).to.eq(updatedResourceName)
    })
  })

  // Step 6: Retrieve resource by ID and validate the response
  it('Get Resource by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${resourceId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.be.an('object')
      expect(response.body.data.name).to.eq(`Updated-${uniqueResourceName}`)
    })
  })

  // Step 7: Retrieve all resources
  it('Get All Resources', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // Step 8: Attempt to delete resource without authentication
  it('Attempt to Delete Resource without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${resourceId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // Step 9: Attempt to delete resource with invalid token
  it('Attempt to Delete Resource with Invalid Token (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${resourceId}`,
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

  // Step 10: Delete resource with valid authentication
  it('Delete Resource with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${resourceId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(
        `Resource with ID ${resourceId} successfully deleted`,
      )
    })
  })
})
