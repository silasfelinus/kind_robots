/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/users.cy.ts

describe('User Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users'
  const authUrl = 'https://kind-robots.vercel.app/api/auth/login'
  const apiKey = Cypress.env('API_KEY') // Global API key
  let createdUserId: number | undefined
  let uniqueUsername: string
  let createdUserToken: string // This will store the specific token for the created user

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
      createdUserId = response.body.data.id
      createdUserToken = response.body.data.apiKey // Store the user-specific token
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
          .to.have.nested.property('data.users')
          .that.is.an('array').that.is.not.empty
      })
    })

    it('Get User by ID with Authentication', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body).to.have.property('message').that.is.a('string')
        expect(response.body).to.have.nested.property('data.id', createdUserId)
      })
    })

    it('Get Usernames', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/usernames`,
        headers: {
          Accept: 'application/json',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body).to.have.property('message').that.is.a('string')
        expect(response.body)
          .to.have.property('data.usernames')
          .that.is.an('array')
        expect(response.body.data.usernames).to.include(uniqueUsername)
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
          .that.includes('Authorization header is missing')
      })
    })

    it('Update User by ID with New Username (with auth)', () => {
      const newUsername = `updateduser${Date.now()}`
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${createdUserToken}`, // Use the correct token for created user
        },
        body: { username: newUsername },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body)
          .to.have.property('message')
          .that.includes('User updated successfully')
        expect(response.body.data.user.username).to.eq(newUsername)

        // Update uniqueUsername to the new username to keep tests consistent
        uniqueUsername = newUsername
      })
    })
  })

  context('Authentication and Error Handling Tests', () => {
    it('User Authentication with Correct Credentials', () => {
      cy.request({
        method: 'POST',
        url: authUrl,
        headers: { 'Content-Type': 'application/json' },
        body: {
          username: uniqueUsername,
          password: 'testtest12',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body).to.have.property('data').that.is.an('object')
      })
    })

    it('User Authentication with Incorrect Credentials', () => {
      cy.request({
        method: 'POST',
        url: authUrl,
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
          .that.includes('Authorization header is missing')
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
