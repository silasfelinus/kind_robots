/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/users.cy.ts

describe('User Management API Tests', () => {
  // Tip: allow overriding these via CYPRESS_BASE_URL / CYPRESS_AUTH_URL if you want to run locally
  const baseUrl =
    Cypress.env('BASE_URL') ?? 'https://kind-robots.vercel.app/api/users'
  const authUrl =
    Cypress.env('AUTH_URL') ?? 'https://kind-robots.vercel.app/api/auth'
  const apiKey = Cypress.env('API_KEY') // bearer apiKey for test user (server-side key to allow register)

  let createdUserId: number | undefined
  let uniqueUsername: string
  let createdUserApiKey: string // <-- this is the user's apiKey, used as Bearer for protected user routes
  let authToken: string // <-- this is the JWT/session token from /auth/login

  // Helpers
  const expectUpdatedMsg = (msg: string) => {
    // Accepts 'User updated', 'User updated.', 'User updated successfully', etc.
    expect(msg.toLowerCase()).to.match(/user updated/)
  }

  const login = (username: string, password = 'testtest12') =>
    cy.request({
      method: 'POST',
      url: `${authUrl}/login`,
      headers: { 'Content-Type': 'application/json' },
      body: { username, password },
      failOnStatusCode: false, // we'll assert below
    })

  before(() => {
    uniqueUsername = `testuser${Date.now()}`
    const userEmail = `${uniqueUsername}@kindrobots.org`

    // 1) Register a user (requires server API key)
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
      failOnStatusCode: false,
    })
      .then((response) => {
        expect(
          response.status,
          `register status: ${response.status} ${JSON.stringify(response.body)}`,
        ).to.be.oneOf([200, 201, 409])
        if (response.status === 409) {
          // Already exists; fetch the user or proceed. If your API returns the user on 409,
          // adjust below accordingly. Otherwise you can login immediately.
          return login(uniqueUsername).then((loginRes) => {
            expect(loginRes.status).to.eq(200)
            expect(loginRes.body?.success).to.eq(true)
            createdUserId = loginRes.body?.data?.user?.id
            // If your login returns apiKey on the user, pick it up; otherwise we won’t use it here.
          })
        }

        expect(response.body).to.have.property('success', true)
        expect(response.body).to.have.property('user')
        createdUserId = response.body.user.id
        // Server returns user's apiKey; we use this as Bearer for user-protected endpoints
        createdUserApiKey = response.body.user.apiKey
      })
      .then(() => {
        // 2) Login to get auth token used by auth endpoints (/validate/token etc.)
        return login(uniqueUsername).then((res) => {
          expect(
            res.status,
            `login status: ${res.status} ${JSON.stringify(res.body)}`,
          ).to.eq(200)
          expect(res.body).to.have.property('success', true)
          // support either { data: { token } } or { token }
          const token = res.body?.data?.token || res.body?.token
          expect(token, 'login token')
            .to.be.a('string')
            .and.have.length.greaterThan(10)
          authToken = token
        })
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
          // Your API reads apiKey from Bearer (per your token util design)
          Authorization: `Bearer ${createdUserApiKey}`,
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
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.success).to.be.true
        expect(response.body.data)
          .to.be.an('array')
          .and.to.include(uniqueUsername)
      })
    })
  })

  context('User Update Tests', () => {
    it('Attempt to Update User by ID without Authentication (expect 403)', () => {
      const newUsername = `unauthorizeduser${Date.now()}`
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${createdUserId}`,
        headers: { Accept: 'application/json' },
        body: { username: newUsername },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(403)
        expect(response.body).to.have.property('success', false)
        expect(response.body)
          .to.have.property('message')
          .that.includes('You do not have permission to update this user')
      })
    })

    it('Update User by ID with New Username (with auth)', () => {
      const newUsername = `updateduser${Date.now()}`
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${createdUserApiKey}`,
        },
        body: { username: newUsername },
      })
        .then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property('success', true)
          expectUpdatedMsg(response.body.message)
          expect(response.body.data.username).to.eq(newUsername)
          uniqueUsername = newUsername
        })
        .then(() => {
          // Re-login after username change to refresh authToken for later tests
          return login(uniqueUsername).then((res) => {
            expect(res.status).to.eq(200)
            expect(res.body?.success).to.eq(true)
            const token = res.body?.data?.token || res.body?.token
            expect(token).to.be.a('string').and.have.length.greaterThan(10)
            authToken = token
          })
        })
    })
  })

  context('Authentication and Error Handling Tests', () => {
    it('User Authentication with Correct Credentials', () => {
      return login(uniqueUsername).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        const token = response.body?.data?.token || response.body?.token
        expect(token, 'token presence').to.be.a('string')
        authToken = token
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
        expect(response.body)
          .to.have.property('message')
          .match(/invalid credentials/i)
      })
    })

    it('Token Validation', () => {
      cy.request({
        method: 'POST',
        url: `${authUrl}/validate/token`,
        headers: {
          'Content-Type': 'application/json',
          // Some implementations require Bearer; include it to be safe.
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          token: authToken, // supports your current body contract
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body).to.have.property('data').that.is.an('object')
      })
    })

    it('API Key Validation (user apiKey)', () => {
      cy.request({
        method: 'POST',
        url: `${authUrl}/validate/api`,
        headers: { 'Content-Type': 'application/json' },
        body: { apiKey: createdUserApiKey },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)

        // Optional: stronger assertions
        expect(response.body)
          .to.have.nested.property('data.kind')
          .that.equals('user')

        if (createdUserId) {
          expect(response.body)
            .to.have.nested.property('data.user.id')
            .that.equals(createdUserId)
        }
      })
    })
  })

  context('User Deletion Tests', () => {
    it('Attempt to Delete User by ID without Authentication (expect 403)', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${createdUserId}`,
        headers: { Accept: 'application/json' },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(403)
        expect(response.body).to.have.property('success', false)
        expect(response.body)
          .to.have.property('message')
          .that.includes('You do not have permission to delete this user')
      })
    })

    it('Delete User by ID with Authentication', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${createdUserApiKey}`,
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
