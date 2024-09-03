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
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.prompt).to.be.an('object'); // Check that the prompt object exists
      expect(response.body.prompt.prompt).to.eq('devil bunny'); // Expect the correct prompt text
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
