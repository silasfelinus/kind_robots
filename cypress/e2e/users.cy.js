// cypress/e2e/api/users.cy.js
/* eslint-disable no-undef */

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
        expect(response.body).to.have.property('success', true)
        expect(response.body).to.have.nested.property('user.id', userId)
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
        expect(response.body).to.have.property('success', true)
        expect(response.body)
          .to.have.property('usernames')
          .that.is.an('array')
          .that.includes('kindguest')
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

  it('Add and Delete User with Full Details', () => {
    // Creating the user
    cy.request({
      method: 'POST',
      url: `${baseUrl}/register`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        username: 'testtesterton144',
        email: 'test144@kindrobots.org',
        password: 'testtest12',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success').to.be.true
      if (response.body.success !== true) {
        console.log('Response body:', response.body)
      }
      expect(response.body)
        .to.have.property('message')
        .contains('Your account has been created.')
      expect(response.body).to.have.nested.property(
        'user.username',
        'testtesterton144',
      )

      // Extracting the userId from the response
      const userId = response.body.user.id

      // Deleting the user using the userId
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${userId}`,
        headers: {
          'x-api-key': apiKey,
        },
      }).then((deleteResponse) => {
        expect(deleteResponse.status).to.eq(200)
      })
    })
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
      expect(response.body).to.have.nested.property(
        'user.username',
        'openaccount',
      )

      const userId = response.body.user.id

      // Deleting the user using the userId
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${userId}`,
        headers: {
          'x-api-key': apiKey,
        },
      }).then((deleteResponse) => {
        expect(deleteResponse.status).to.eq(200)
      })
    })

    it('Add User with Email Only', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/register`,
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
        expect(response.body).to.have.nested.property(
          'user.email',
          'emailt4tHere@example.com',
        )

        // Extracting the userId from the response
        const userId = response.body.user.id

        // Deleting the user using the userId
        cy.request({
          method: 'DELETE',
          url: `${baseUrl}/${userId}`,
          headers: {
            'x-api-key': apiKey,
          },
        }).then((deleteResponse) => {
          expect(deleteResponse.status).to.eq(200)
        })
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
          username: 'silasfelinus', // Use a username known to exist
          email: 'newemail@kindrobots.org',
          password: 'newUserPassword',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.body)
          .to.have.property('message')
          .that.includes('Username already exists.')
      })
    })
  })
})

describe('User Management API Tests - User Update', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users'
  const apiKey = Cypress.env('API_KEY') // Ensure the API key is stored securely

  context('User Update Tests', () => {
    it('Update User by ID with New Username', () => {
      const userId = 22 // Specify the user ID to update
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${userId}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          username: 'kindguest',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.nested.property(
          'user.username',
          'kindguest',
        )
      })
    })

    it('Update User by ID with Password', () => {
      const userId = 22
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${userId}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          password: 'kindpassword1',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.nested.property('user.id', userId)
      })
    })

    it('Update User by ID with Email', () => {
      const userId = 22
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
        expect(response.body).to.have.nested.property(
          'user.email',
          'updated@example.com',
        )
      })
    })
  })
})

describe('User Management API Tests - User Deletion', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/users'
  const apiKey = Cypress.env('API_KEY') // Ensure the API key is stored securely

  context('User Deletion Tests', () => {
    it('Delete User by ID', () => {
      const userId = 99999 // Specify the user ID to delete
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${userId}`,
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200) // Assuming API returns 204 No Content on successful deletion
      })
    })

    it('Delete User Without Permission', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/99998`,
        headers: {
          Accept: 'application/json',
        },
        failOnStatusCode: false, // Prevent Cypress from failing the test when a 4xx status code is returned
      }).then((response) => {
        expect(response.status).to.eq(401)
      })
    })
  })
})

// cypress/e2e/userManagement.cy.js
describe('User Management API Tests - Authentication and Error Handling', () => {
  const authUrl = 'https://kind-robots.vercel.app/api/auth/login'

  context('Authentication Tests', () => {
    it('User Authentication with Correct Credentials', () => {
      cy.request({
        method: 'POST',
        url: authUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          username: 'kindguest',
          password: 'kindpassword1',
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          username: 'kindguest',
          password: 'wrongPassword',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.body).to.have.property('success', false)
      })
    })
  })
})
