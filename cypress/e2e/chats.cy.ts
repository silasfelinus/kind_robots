describe('ChatExchange Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/chats';
  const apiKey = Cypress.env('API_KEY');
  let chatExchangeId: number; // Explicitly define the type as number
  const userId: number = 1; // Example user ID (assuming 1 is valid)
  const botId: number = 2; // Example bot ID (assuming 2 is valid)

  it('Create a New Chat Exchange', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        userId: userId,
        botId: botId,
        botName: 'AMI',
        username: 'silasfelinus',
        userPrompt: 'How are you?',
        botResponse: "I'm fine, thank you!",
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(response.body.newChatExchange).to.be.an('object').that.is.not.empty;
      chatExchangeId = response.body.newChatExchange.id;
      console.log('Created ChatExchange ID:', chatExchangeId);
    });
  });

  it('Get Chat Exchange by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${chatExchangeId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.chatExchange.botName).to.eq('AMI');
    });
  });

  it('Get All Chat Exchanges', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.chatExchanges)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  it('Get Chat Exchanges by User ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/user/${userId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.chatExchanges)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  it('Get Chat Exchanges by Bot ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/bot/${botId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.chatExchanges)
        .to.be.an('array')
        .and.have.length.greaterThan(0);
    });
  });

  it('Update a Chat Exchange by ID', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${chatExchangeId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        userPrompt: 'How are you?',
        botResponse: "I'm great, thank you!",
        liked: true, // Ensure `liked` is a valid field or remove it
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  it('Add or Update Reaction to a Chat Exchange by ID', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${chatExchangeId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        liked: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  it('Delete a Chat Exchange by ID', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${chatExchangeId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  after(() => {
    if (chatExchangeId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${chatExchangeId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        console.log('Reverted ChatExchange ID:', chatExchangeId);
      });
    }
  });
});
