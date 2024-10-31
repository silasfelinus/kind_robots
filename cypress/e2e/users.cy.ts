// cypress/e2e/users.cy.ts

/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('User Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users'
  const authUrl = 'https://kind-robots.vercel.app/api/auth/login'
  const apiKey = Cypress.env('API_KEY')

  let createdUserId: number | undefined
  let uniqueUsername: string

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
      createdUserId = response.body.user.id
    })
  })

  // Delete the user after all tests
  after(() => {
    if (createdUserId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    }
  })

  context('User Retrieval Tests', () => {
    it('Get All Users with Authentication', () => {
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
        expect(response.body)
          .to.have.nested.property('users.users')
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
        expect(response.body).to.have.nested.property('user.id', createdUserId)
      })
    })

    it('Get Usernames with Authentication', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/usernames`,
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body.usernames).to.include(uniqueUsername)
      })
    })
  })

  context('User Update Tests', () => {
    it('Attempt to Update User by ID without Authentication (expect failure)', () => {
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
        expect(response.status).to.eq(403)
      })
    })

    it('Update User by ID with New Username', () => {
      const newUsername = `updateduser${Date.now()}`
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
        body: { username: newUsername },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.user.username).to.eq(newUsername)
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
        expect(response.body).to.have.property('user')
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
    it('Attempt to Delete User by ID without Authentication (expect failure)', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(403)
      })
    })

    it('Delete User by ID with Authentication', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    })
  })
})
