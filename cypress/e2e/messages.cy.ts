// cypress/e2e/api/message.cy.ts

describe('Message Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/messages';
  const apiKey = Cypress.env('API_KEY');
  let messageId: number; // Explicitly define the type as number
  const channelId: number = 2; // Example channel ID (assuming 2 is for livechat)

  it('Create New Message', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        sender: 'WELCOMEBOT',
        recipient: 'Kind User',
        content: 'Hello! Welcome to our Livechat!',
        channelId: channelId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(response.body.newMessage).to.be.an('object').that.is.not.empty;
      /* eslint-enable @typescript-eslint/no-unused-expressions */
      messageId = response.body.newMessage.id; // Ensure the correct ID is captured
      console.log('Created Message ID:', messageId); // Log for debugging
    });
  });

  it('Get All Messages', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.messages)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  it('Get Message by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${messageId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.message.sender).to.eq('WELCOMEBOT'); // Expect the correct sender
    });
  });

  it('Update a Message', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${messageId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        content: 'Hello! Welcome to our updated Livechat!',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      // Verify the update
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${messageId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.message.content).to.eq('Hello! Welcome to our updated Livechat!'); // Check updated content
      });
    });
  });

  it('Delete a Message', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${messageId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  // Ensure all changes are reverted by deleting the message created during the test
  after(() => {
    if (messageId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${messageId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        console.log('Reverted Message ID:', messageId);
      });
    }
  });
});
