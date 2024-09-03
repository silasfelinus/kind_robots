// cypress/e2e/api/resource.cy.ts

describe('Resource Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/resources';
  const apiKey = Cypress.env('API_KEY');
  let resourceId: number | undefined; // Updated to include undefined type
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
        resourceType: 'URL', // Assuming 'IMAGE' is a valid resource type
        isMature: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(response.body.resource).to.be.an('object').that.is.not.empty;
      resourceId = response.body.resource.id; // Ensure the correct ID is captured
      console.log('Created Resource ID:', resourceId); // Log for debugging
    }).then(() => {
      if (!resourceId) {
        throw new Error('Resource ID was not set');
      }
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
        userId: 10,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.resource.name).to.eq(updatedResourceName); // Verify name is updated
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
    } else {
      console.log('No resourceId to delete.');
    }
  });
});
