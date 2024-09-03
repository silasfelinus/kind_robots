// cypress/e2e/api/art-reaction.cy.ts
 

describe('ArtReaction Management API Tests', () => {
    const baseUrl = 'https://kind-robots.vercel.app/api/reactions';
    const apiKey = Cypress.env('API_KEY');
    let reactionId: number; // Explicitly define the type as number
    const artId: number = 5; // Example art ID (assuming 5 is valid)
    const userId: number = 1; // Example user ID (assuming 1 is valid)
  
    it('Get All Art Reactions', () => {
      cy.request({
        method: 'GET',
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.reactions)
          .to.be.an('array')
          .and.have.length.greaterThan(0);
      });
    });
  
    it('Create a New Art Reaction', () => {
      cy.request({
        method: 'POST',
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          userId: userId,
          artId: artId,
          claps: 0,
          boos: 5,
          title: 'hmmm!',
          reaction: 'skeptical',
          comment: 'not sure here',
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        /* eslint-disable @typescript-eslint/no-unused-expressions */
        expect(response.body.newReaction).to.be.an('object').that.is.not.empty;
        /* eslint-enable @typescript-eslint/no-unused-expressions */
        reactionId = response.body.newReaction.id; // Ensure the correct ID is captured
        console.log('Created Art Reaction ID:', reactionId); // Log for debugging
      });
    });
  
    it('Edit an Existing Art Reaction', () => {
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${reactionId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          claps: 10,
          comment: 'Still loving this art!',
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  
    it('Delete an Art Reaction', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${reactionId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  
    // Ensure all changes are reverted by deleting all reactions made during the test
    after(() => {
      if (reactionId) {
        cy.request({
          method: 'DELETE',
          url: `${baseUrl}/${reactionId}`,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          console.log('Reverted Art Reaction ID:', reactionId);
        });
      }
    });
  });
  