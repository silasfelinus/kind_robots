/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/api/users.cy.ts

describe('User Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users';
  const apiKey = Cypress.env('API_KEY'); // Securely retrieve the API key

  let createdUserId: number | undefined = undefined; // Explicitly initializing as undefined
  let uniqueUsername: string = ''; // Initialize as an empty string

  // Create a new user before each test
  beforeEach(() => {
    uniqueUsername = `testuser${Date.now()}`;
    const userEmail = `${uniqueUsername}@kindrobots.org`;

    cy.request({
      method: 'POST',
      url: `${baseUrl}/register`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        username: uniqueUsername,
        email: userEmail,
        password: 'testtest12',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
      createdUserId = response.body.user.id; // Store the created user ID
    });
  });

  // Clean up (delete the user) after each test
  afterEach(() => {
    if (createdUserId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    }
  });

  context('User Retrieval Tests', () => {
    it('Get All Users with Authentication', () => {
      cy.request({
        method: 'GET',
        url: baseUrl,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body)
          .to.have.nested.property('users.users')
          .that.is.an('array').that.is.not.empty;
      });
    });

    it('Get User by ID with Authentication', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body).to.have.nested.property('user.id', createdUserId);
      });
    });

    it('Get Usernames with Authentication', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/usernames`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body)
          .to.have.property('usernames')
          .that.is.an('array')
          .that.includes(uniqueUsername);
      });
    });
  });

  // Additional tests related to user management
});

describe('User Management API Tests - User Update', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users';
  const apiKey = Cypress.env('API_KEY'); // Ensure the API key is stored securely

  let createdUserId: number | undefined = undefined; // Explicitly initializing as undefined
  let uniqueUsername: string = ''; // Initialize as an empty string

  // Create a new user before each test
  beforeEach(() => {
    uniqueUsername = `updateuser${Date.now()}`;
    const userEmail = `${uniqueUsername}@kindrobots.org`;

    cy.request({
      method: 'POST',
      url: `${baseUrl}/register`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        username: uniqueUsername,
        email: userEmail,
        password: 'testtest12',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
      createdUserId = response.body.user.id; // Store the created user ID
    });
  });

  // Clean up (delete the user) after each test
  afterEach(() => {
    if (createdUserId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    }
  });

  context('User Update Tests', () => {
    it('Update User by ID with New Username', () => {
      const newUsername = `updateduser${Date.now()}`;
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          username: newUsername,
        },
        
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.nested.property('user.username', newUsername);
      });
    });

    it('Update User by ID with Password', () => {
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          password: 'newpassword12',
        },
        timeout: 20000,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.nested.property('user.id', createdUserId);
      });
    });

    it('Update User by ID with Email', () => {
      const newEmail = `updated${Date.now()}@example.com`;
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          email: newEmail,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.nested.property('user.email', newEmail);
      });
    });
  });
});

describe('User Management API Tests - Authentication and Error Handling', () => {
  const authUrl = 'https://kind-robots.vercel.app/api/auth/login';
  const apiKey = Cypress.env('API_KEY'); // Ensure the API key is stored securely

  let createdUserId: number | undefined = undefined; // Explicitly initializing as undefined
  let uniqueUsername: string = ''; // Initialize as an empty string

  // Create a new user before the authentication tests
  before(() => {
    uniqueUsername = `authuser${Date.now()}`;
    const userEmail = `${uniqueUsername}@kindrobots.org`;

    cy.request({
      method: 'POST',
      url: 'https://kind-robots.vercel.app/api/users/register',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        username: uniqueUsername,
        email: userEmail,
        password: 'authpassword12',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
      createdUserId = response.body.user.id; // Store the created user ID
    });
  });

  // Clean up (delete the user) after all tests
  after(() => {
    if (createdUserId) {
      cy.request({
        method: 'DELETE',
        url: `https://kind-robots.vercel.app/api/users/${createdUserId}`,
        headers: {
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    }
  });

  context('Authentication Tests', () => {
    it('User Authentication with Correct Credentials', () => {
      cy.request({
        method: 'POST',
        url: authUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          username: uniqueUsername,
          password: 'authpassword12',
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('user');
      });
    });

    it('User Authentication with Incorrect Credentials', () => {
      cy.request({
        method: 'POST',
        url: authUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          username: uniqueUsername,
          password: 'wrongPassword',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('success', false);
        expect(response.body).to.have.property('message', 'Invalid credentials');
      });
    });
  });
});
