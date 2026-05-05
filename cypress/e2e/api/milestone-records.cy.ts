// cypress/e2e/api/milestone-records.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Milestone Record Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api'
  const recordsUrl = `${baseUrl}/milestones/records`
  const usersUrl = `${baseUrl}/users`
  const milestoneId = 10
  const invalidToken = 'invalidTokenValue'

  let apiKey = ''
  let milestoneRecordId: number | undefined
  let createdUserId: number | undefined
  let createdUserToken: string | undefined

  before(() => {
    cy.env(['API_KEY']).then((env) => {
      apiKey = String(env.API_KEY || '')
      expect(apiKey, 'API_KEY').to.be.a('string').and.not.be.empty
    })

    cy.then(() => {
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
        expect(response.status).to.be.oneOf([200, 201])
        expect(response.body).to.have.property('success', true)

        createdUserId = response.body.user.id
        createdUserToken = response.body.user.apiKey

        expect(createdUserId).to.be.a('number')
        expect(createdUserToken).to.be.a('string').and.not.be.empty
      })
    })
  })

  it('should not allow creating a milestone record without an authorization token', () => {
    expect(createdUserId).to.exist

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
    expect(createdUserId).to.exist

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
    expect(createdUserId).to.exist
    expect(createdUserToken).to.be.a('string').and.not.be.empty

    cy.request({
      method: 'POST',
      url: recordsUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${createdUserToken}`,
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

      expect(milestoneRecordId).to.be.a('number')
    })
  })

  it('Attempt to Delete Milestone Record without Authentication (expect failure)', () => {
    expect(milestoneRecordId).to.exist

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

  it('Attempt to Delete Milestone Record with Invalid Token (expect failure)', () => {
    expect(milestoneRecordId).to.exist

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

  it('Delete Milestone Record with Authentication', () => {
    expect(milestoneRecordId).to.exist
    expect(createdUserToken).to.be.a('string').and.not.be.empty

    cy.request({
      method: 'DELETE',
      url: `${recordsUrl}/${milestoneRecordId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${createdUserToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(
        `Milestone Record with ID ${milestoneRecordId} successfully deleted`,
      )

      cy.log('Deleted Milestone Record ID:', String(milestoneRecordId))
      milestoneRecordId = undefined
    })
  })

  after(() => {
    cy.then(() => {
      if (!createdUserId || !createdUserToken) {
        return
      }

      cy.request({
        method: 'DELETE',
        url: `${usersUrl}/${createdUserId}`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${createdUserToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 404])

        if (response.status === 200) {
          expect(response.body).to.have.property('success', true)
          cy.log(`User with ID ${createdUserId} successfully deleted`)
        } else {
          cy.log(
            `User deletion failed or already deleted. Status: ${response.status}`,
          )
        }
      })
    })
  })
})
