// cypress/e2e/api/prompt.cy.ts

describe('ArtPrompt Management API Tests', () => {
    const baseUrl = 'https://kind-robots.vercel.app/api/prompts';
    const apiKey = Cypress.env('API_KEY');
    let artPromptId: number; // Explicitly define the type as number
  
    it('Create New ArtPrompt', () => {
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
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(response.body.newArtPrompt).to.be.an('object').that.is.not.empty;
      /* eslint-enable @typescript-eslint/no-unused-expressions */
        artPromptId = response.body.newArtPrompt.id; // Ensure the correct ID is captured
        console.log('Created ArtPrompt ID:', artPromptId); // Log for debugging
      });
    });
  
    it('Get ArtPrompt by ID', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/id/${artPromptId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.artPrompt.prompt).to.eq('devil bunny'); // Expect the correct prompt
      });
    });
  
    it('Get All ArtPrompts', () => {
      cy.request({
        method: 'GET',
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.artPrompts)
          .to.be.an('array')
          .and.have.length.greaterThan(0);
      });
    });
  
    it('Update an ArtPrompt', () => {
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${artPromptId}`,
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
  
    it('Delete an ArtPrompt', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${artPromptId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  });
  