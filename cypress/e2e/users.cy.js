// cypress/e2e/api/users.cy.js
/* eslint-disable no-undef */
describe('Users API Endpoint', () => {
  // Test successful fetch of users
  it('successfully fetches users', () => {
    cy.request('/api/users').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body).to.have.property('users')
    })
  })
})

// User Authentication
// User Authentication and Retrieval Tests
describe('User Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users'
  const apiKey = Cypress.env('API_KEY') // Securely retrieve the API key

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
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body)
          .to.have.nested.property('users.users')
          .that.is.an('array').that.is.not.empty
      })
    })

    it('Get All Users without Authentication (expect 401)', () => {
      cy.request({
        method: 'GET',
        url: baseUrl,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401)
      })
    })

    it('Get User by ID with Authentication', () => {
      const userId = 17 // Example user ID
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${userId}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('id', userId)
      })
    })

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
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('array').that.is.not.empty
      })
    })
  })
})

//get user milestones
describe('User Milestones API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users/milestones'
  const apiKey = Cypress.env('API_KEY')

  it('Retrieves milestones for a specific user', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/17`, // Adjust the URL to use the correct user ID dynamically if needed
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property(
        'message',
        'Milestone records fetched successfully',
      )
      expect(response.body).to.have.property('milestoneIds').that.is.an('array')
    })
  })
})

// User Creation Tests
describe('User Management API Tests - User Creation', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users'
  const apiKey = Cypress.env('API_KEY')

  it('Add User with Full Details', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/register`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        username: 'testtesterton4',
        email: 'test4@kindrobots.org',
        password: 'testtest12',
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('id')
    })

    it('Add User with Username Only', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/register`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          username: 'openaccount',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400) // Assuming 400 Bad Request for insufficient data
      })
    })

    it('Add User with Email Only', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          email: 'emailt4tHere@example.com',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400) // Assuming 400 Bad Request for incomplete data
      })
    })

    it('Add User with Existing Username', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/register`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          username: 'existingUsername', // Use a username known to exist
          email: 'newemail@kindrobots.org',
          password: 'newUserPassword',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(409) // Assuming 409 Conflict for existing user
      })
    })
  })
})

// cypress/e2e/userManagement.cy.js
describe('User Management API Tests - User Update', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users'
  const apiKey = Cypress.env('API_KEY') // Ensure the API key is stored securely

  context('User Update Tests', () => {
    it('Update User by ID with New Username', () => {
      const userId = 18 // Specify the user ID to update
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${userId}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          username: 'superkateisuper',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('username', 'superkateisuper')
      })
    })

    it('Update User by ID with Password', () => {
      const userId = 18
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${userId}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          password: 'testtest87',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('id', userId)
      })
    })

    it('Update User by ID with Email', () => {
      const userId = 18
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${userId}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          email: 'updated@example.com',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('email', 'updated@example.com')
      })
    })
  })
})

// cypress/e2e/userManagement.cy.js
describe('User Management API Tests - User Deletion', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users'
  const apiKey = Cypress.env('API_KEY') // Ensure the API key is stored securely

  context('User Deletion Tests', () => {
    it('Delete User by ID', () => {
      const userId = 18 // Specify the user ID to delete
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${userId}`,
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(204) // Assuming API returns 204 No Content on successful deletion
      })
    })

    it('Delete User Without ID', () => {
      cy.request({
        method: 'DELETE',
        url: baseUrl, // Attempting to delete without specifying an ID
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
        failOnStatusCode: false, // Prevent Cypress from failing the test when a 4xx status code is returned
      }).then((response) => {
        expect(response.status).to.eq(405) // Assuming API returns 405 Method Not Allowed if ID is not provided
      })
    })
  })
})

// cypress/e2e/userManagement.cy.js
describe('User Management API Tests - Authentication and Error Handling', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users'
  const authUrl = 'https://kind-robots.vercel.app/api/auth/login'
  const apiKey = Cypress.env('API_KEY') // Ensure the API key is stored securely

  context('Authentication Tests', () => {
    it('User Authentication with Correct Credentials', () => {
      cy.request({
        method: 'POST',
        url: authUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          username: 'validUsername',
          password: 'validPassword',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('token') // Assuming the response contains an auth token
      })
    })

    it('User Authentication with Incorrect Credentials', () => {
      cy.request({
        method: 'POST',
        url: authUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          username: 'invalidUsername',
          password: 'wrongPassword',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401) // Assuming 401 Unauthorized for wrong credentials
      })
    })
  })

  context('Error Handling Tests', () => {
    it('Update Non-existent User', () => {
      const nonExistentUserId = 9999 // A user ID that does not exist
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${nonExistentUserId}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          username: 'newUsername',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404) // Assuming 404 Not Found for non-existent user
      })
    })

    it('Delete Non-existent User', () => {
      const nonExistentUserId = 9999 // A user ID that does not exist
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${nonExistentUserId}`,
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404) // Assuming 404 Not Found for non-existent user
      })
    })
  })
})

// cypress/e2e/userManagement.cy.js
describe('User Management API Tests - Edge Cases', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users'
  const apiKey = Cypress.env('API_KEY') // Ensure the API key is stored securely

  context('Edge Case Tests', () => {
    it('Add User with Invalid Email Format', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/register`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          username: 'newUser',
          email: 'notanemail', // Intentionally invalid email format
          password: 'password123',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400) // Assuming 400 Bad Request for invalid input
        expect(response.body)
          .to.have.property('message')
          .that.includes('Invalid email format')
      })
    })
  })
})
