// cypress/e2e/api/channel.cy.ts
 

describe('Channel Management API Tests', () => {
    const baseUrl = 'https://kind-robots.vercel.app/api/channels';
    const apiKey = Cypress.env('API_KEY');
    let channelId: number; // Explicitly define the type as number
  
    it('Create New Channel', () => {
      cy.request({
        method: 'POST',
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          userId: 0,
          label: 'feed',
          description: 'global feed',
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        /* eslint-disable @typescript-eslint/no-unused-expressions */
        expect(response.body.newChannel).to.be.an('object').that.is.not.empty;
        /* eslint-enable @typescript-eslint/no-unused-expressions */
        channelId = response.body.newChannel.id; // Ensure the correct ID is captured
        console.log('Created Channel ID:', channelId); // Log for debugging
      });
    });
  
    it('Get Channel by ID with Messages', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${channelId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.channel.label).to.eq('feed'); // Expect the correct label
        expect(response.body.channel.messages).to.be.an('array'); // Expect an array of messages
      });
    });
  
    it('Get All Channels', () => {
      cy.request({
        method: 'GET',
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.channels)
          .to.be.an('array')
          .and.have.length.greaterThan(0);
      });
    });
  
    it('Update a Channel', () => {
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${channelId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          label: 'botcafe',
          description: 'global botchat',
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  
    it('Delete a Channel', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${channelId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  });
  