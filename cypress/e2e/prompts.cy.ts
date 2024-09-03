// cypress/e2e/api/prompt.cy.ts

describe('Prompt Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/prompts';
  const apiKey = Cypress.env('API_KEY');
  let promptId: number; // Explicitly define the type as number

  it('Create New Prompt', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        galleryId: 21,
        userId: 1,
        prompt: 'devil bunny',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.newPrompt).to.be.an('object');
      expect(Object.keys(response.body.newPrompt)).to.have.length.greaterThan(0);
      promptId = response.body.newPrompt.id; // Ensure the correct ID is captured
      console.log('Created Prompt ID:', promptId); // Log for debugging
    });
  });
  

  it('Get Prompt by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/id/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      failOnStatusCode: false, // Allows the test to proceed even if the status code isn't 200
    }).then((response) => {
      // Log the entire response for debugging purposes
      cy.log('Response:', JSON.stringify(response, null, 2));
  
      // Assert that the status code is 200
      expect(response.status).to.eq(200, 'Expected status code to be 200');
  
      // Assert that the body has the prompt object
      expect(response.body).to.have.property('prompt');
      
      // Log the prompt object for debugging
      cy.log('Prompt Object:', JSON.stringify(response.body.prompt, null, 2));
  
      // Assert that the prompt property is an object and contains the expected prompt text
      expect(response.body.prompt).to.be.an('object');
      expect(response.body.prompt.prompt).to.eq('devil bunny');
    });
  });
  

  it('Get All Prompts', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.prompts)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  it('Update a Prompt', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        prompt: 'angel bunny',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  it('Delete a Prompt', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });
});
