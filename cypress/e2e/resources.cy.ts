// cypress/e2e/api/resource.cy.ts

describe('Resource Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/resources';
  const apiKey = Cypress.env('API_KEY');
  let resourceId: number; // Explicitly define the type as number
  const uniqueResourceName = `Resource-${Date.now()}`; // Generate a unique resource name using Date.now()

  it('Create a New Resource', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        userId: 1,
        name: uniqueResourceName,
        customLabel: 'Custom Label',
        MediaPath: '/media/test-resource.jpg',
        customUrl: 'https://custom-url.com',
        civitaiUrl: 'https://civitai-url.com',
        huggingUrl: 'https://huggingface-url.com',
        localPath: '/local/test-resource',
        description: 'This is a test resource description.',
        resourceType: 'IMAGE', // Assuming 'IMAGE' is a valid resource type
        isMature: false,
        galleryCount: 5,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      assert.isObject(response.body.newResource, 'newResource is an object');
      assert.isNotEmpty(response.body.newResource, 'newResource is not empty');
      resourceId = response.body.newResource.id; // Ensure the correct ID is captured
      console.log('Created Resource ID:', resourceId); // Log for debugging
    });
  });

  it('Get Resource by ID', () => {
    if (!resourceId) {
      throw new Error('resourceId is undefined, cannot fetch resource by ID');
    }
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${resourceId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      failOnStatusCode: false, // This prevents Cypress from failing the test immediately on a 500 error
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.resource.name).to.eq(uniqueResourceName); // Expect the correct name
    });
  });

  it('Get All Resources', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.resources)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  it('Update a Resource', () => {
    if (!resourceId) {
      throw new Error('resourceId is undefined, cannot update resource by ID');
    }
    const updatedResourceName = `Updated-${uniqueResourceName}`;
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
        galleryCount: 10,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.updatedResource.name).to.eq(updatedResourceName); // Verify name is updated
    });
  });

  it('Delete a Resource', () => {
    if (!resourceId) {
      throw new Error('resourceId is undefined, cannot delete resource by ID');
    }
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${resourceId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  // Ensure all changes are reverted by deleting the resource created during the test
  after(() => {
    if (resourceId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${resourceId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        console.log('Reverted Resource ID:', resourceId);
      });
    }
  });
});
