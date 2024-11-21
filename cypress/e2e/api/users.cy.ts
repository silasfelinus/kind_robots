/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/users.cy.ts

describe('User Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users'
  const authUrl = 'https://kind-robots.vercel.app/api/auth'
  const apiKey = Cypress.env('API_KEY') // bearer apiKey for test user
  let createdUserId: number | undefined
  let uniqueUsername: string
  let createdUserToken: string // This will store the specific token for the created user
  let authToken: string //the auth token is the user.token. the bearer token is user.apiKey

  // Create a user once before all tests
  before(() => {
    uniqueUsername = `testuser${Date.now()}`
    const userEmail = `${uniqueUsername}@kindrobots.org`

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
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('message').that.is.a('string')
      createdUserId = response.body.user.id
      createdUserToken = response.body.user.apiKey // Store the user-specific token
    })
  })

  context('User Retrieval Tests', () => {
    it('Get All Users', () => {
      cy.request({
        method: 'GET',
        url: baseUrl,
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body).to.have.property('message').that.is.a('string')
        expect(response.body)
          .to.have.nested.property('data')
          .that.is.an('array').that.is.not.empty
      })
    })

    it('Get User by ID with Authentication', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${createdUserToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body).to.have.property('message').that.is.a('string')
        expect(response.body).to.have.nested.property('data.id', createdUserId)
      })
    })

    // Test to get all usernames
    it('Get Usernames', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/usernames`,
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.success).to.be.true
        expect(response.body.data) // Access `data` directly as an array
          .to.be.an('array')
          .and.to.include(uniqueUsername) // Check for the specific username
      })
    })
  })

  context('User Update Tests', () => {
    it('Attempt to Update User by ID without Authentication (expect 401)', () => {
      const newUsername = `unauthorizeduser${Date.now()}`
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
        },
        body: { username: newUsername },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401)
        expect(response.body).to.have.property('success', false)
        expect(response.body)
          .to.have.property('message')
          .that.includes('Authorization token is required in the format')
      })
    })

    it('Update User by ID with New Username (with auth)', () => {
      const newUsername = `updateduser${Date.now()}`
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${createdUserToken}`,
        },
        body: { username: newUsername },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body)
          .to.have.property('message')
          .that.includes('User updated successfully')
        expect(response.body.data.username).to.eq(newUsername)
        uniqueUsername = newUsername
      })
    })
  })

  context('Authentication and Error Handling Tests', () => {
    it('User Authentication with Correct Credentials', () => {
      cy.request({
        method: 'POST',
        url: `${authUrl}/login`,
        headers: { 'Content-Type': 'application/json' },
        body: {
          username: uniqueUsername,
          password: 'testtest12',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body).to.have.property('data').that.is.an('object')
        expect(response.body.data).to.have.property('token')
        authToken = response.body.data.token
      })
    })

    it('User Authentication with Incorrect Credentials', () => {
      cy.request({
        method: 'POST',
        url: `${authUrl}/login`,
        headers: { 'Content-Type': 'application/json' },
        body: {
          username: uniqueUsername,
          password: 'wrongPassword',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401)
        expect(response.body).to.have.property('success', false)
        expect(response.body).to.have.property('message', 'Invalid credentials')
      })
    })
    it('Token Validation', () => {
      cy.request({
        method: 'POST',
        url: `${authUrl}/validate/token`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          token: authToken, // Use the user-specific token
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body).to.have.property('data').that.is.an('object')
      })
    })

    it('API Key Validation', () => {
      cy.request({
        method: 'POST',
        url: `${authUrl}/validate/api`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          apiKey: apiKey, // Use the user's test key
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
      })
    })
  })

  context('User Deletion Tests', () => {
    it('Attempt to Delete User by ID without Authentication (expect 401)', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401)
        expect(response.body).to.have.property('success', false)
        expect(response.body)
          .to.have.property('message')
          .that.includes('Authorization token is required in the format ')
      })
    })

    it('Delete User by ID with Authentication', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${createdUserToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body)
          .to.have.property('message')
          .that.includes(`User with ID ${createdUserId} successfully deleted`)
      })
    })
  })
})
