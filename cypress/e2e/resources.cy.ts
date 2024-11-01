/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/resources.cy.ts

describe('Resource Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/resources'
  const userToken = Cypress.env('USER_TOKEN')
  let resourceId: number | undefined
  const uniqueResourceName = `Resource-${Date.now()}`

  // Step 1: Create a new resource with proper authentication
  it('Create a New Resource', () => {
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
      expect(response.status).to.eq(200)
      expect(response.body.resource).to.be.an('object').that.is.not.empty
      resourceId = response.body.resource.id
    })
  })

  // Step 2: Attempt to update resource without authentication
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
      expect(response.status).to.eq(401) // Unauthorized without token
    })
  })

  // Step 3: Update resource with valid authentication
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
      expect(response.body.resource.name).to.eq(updatedResourceName)
    })
  })

  // Step 4: Retrieve resource by ID and validate the response
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
      expect(response.body.resource).to.be.an('object')
      expect(response.body.resource.name).to.eq(`Updated-${uniqueResourceName}`)
    })
  })

  // Step 5: Retrieve all resources
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
      expect(response.body.resources)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // Step 6: Attempt to delete resource without authentication
  it('Attempt to Delete Resource without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${resourceId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })
  })

  // Step 7: Delete resource with valid authentication
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
    })
  })

  // Cleanup in case the resource was not deleted during tests
  after(() => {
    if (resourceId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${resourceId}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    }
  })
})
