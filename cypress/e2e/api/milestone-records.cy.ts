// cypress/e2e/milestone-records.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Milestone Record Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api'
  const recordsUrl = `${baseUrl}/milestones/records`
  const usersUrl = `${baseUrl}/users`
  const apiKey = Cypress.env('API_KEY')

  let milestoneRecordId: number | undefined
  let createdUserId: number | undefined
  let createdUserToken: string | undefined // Store user-specific token for authentication
  const milestoneId = 10 // Set milestone ID for testing
  const invalidToken = 'invalidTokenValue'

  // Step 1: Create a new test user
  before(() => {
    const uniqueUsername = `testuser${Date.now()}`
    const userEmail = `${uniqueUsername}@kindrobots.org`

    cy.request({
      method: 'POST',
      url: `${usersUrl}/register`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        username: uniqueUsername,
        email: userEmail,
        password: 'testpassword123',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      createdUserId = response.body.data.id
      createdUserToken = response.body.data.apiKey // Store the user-specific token
    })
  })

  // Step 2: Attempt to create a milestone record with various authentication scenarios

  it('should not allow creating a milestone record without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: recordsUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        userId: createdUserId,
        milestoneId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow creating a milestone record with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: recordsUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        userId: createdUserId,
        milestoneId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create a New Milestone Record for the New User with Valid Authentication', () => {
    cy.request({
      method: 'POST',
      url: recordsUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${createdUserToken}`, // Use user-specific token
      },
      body: {
        userId: createdUserId,
        milestoneId,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty
      milestoneRecordId = response.body.data.id
    })
  })

  // Step 3: Attempt to delete milestone record without authentication (expect failure)
  it('Attempt to Delete Milestone Record without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${recordsUrl}/${milestoneRecordId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // Step 4: Attempt to delete milestone record with invalid authentication token (expect failure)
  it('Attempt to Delete Milestone Record with Invalid Token (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${recordsUrl}/${milestoneRecordId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Step 5: Delete milestone record with valid authentication
  it('Delete Milestone Record with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${recordsUrl}/${milestoneRecordId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${createdUserToken}`, // Use user-specific token
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.message).to.include(
        `Milestone record with ID ${milestoneRecordId} successfully deleted`,
      )
      cy.log('Deleted Milestone Record ID:', milestoneRecordId)
    })
  })

  // Step 6: Clean up by deleting the user created at the beginning
  after(() => {
    if (createdUserId) {
      cy.request({
        method: 'DELETE',
        url: `${usersUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${createdUserToken}`, // Use the created user’s token
        },
        failOnStatusCode: false,
      }).then((response) => {
        if (response.status === 200) {
          expect(response.body).to.have.property('success', true)
          cy.log(`User with ID ${createdUserId} successfully deleted`)
        } else {
          cy.log(
            `User deletion failed or already deleted. Status: ${response.status}`,
          )
        }
      })
    }
  })
})
