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
        title: 'Global Feed',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.channel).to.be.an('object')
      channelId = response.body.channel.id;
      console.log('Created Channel ID:', channelId);
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
        title: 'Bot Cafe', // Update title as well
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.channel).to.include({
        label: 'botcafe',
        description: 'global botchat',
        title: 'Bot Cafe',
      });
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
