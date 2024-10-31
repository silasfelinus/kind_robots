/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/resources.cy.ts

describe('Resource Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/resources'
  const apiKey = Cypress.env('API_KEY')
  let resourceId: number | undefined
  const uniqueResourceName = `Resource-${Date.now()}`

  it('Create a New Resource', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Update Resource with Authentication', () => {
    const updatedResourceName = `Updated-${uniqueResourceName}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${resourceId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        name: updatedResourceName,
        description: 'This is an updated test resource description.',
        userId: 10,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.resource.name).to.eq(updatedResourceName)
    })
  })

  it('Get Resource by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${resourceId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.resource).to.be.an('object')
      expect(response.body.resource.name).to.eq(uniqueResourceName)
    })
  })

  it('Get All Resources', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.resources)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Attempt to Delete Resource without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${resourceId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Delete Resource with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${resourceId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  // Ensure cleanup: delete resource if it wasn't already removed
  after(() => {
    if (resourceId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${resourceId}`,
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
