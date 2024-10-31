// cypress/e2e/milestone-records.cy.ts

/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Milestone Record Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/milestones/records'
  const apiKey = Cypress.env('API_KEY')

  let milestoneRecordId: number
  const userId = 9 // Use existing test user
  const milestoneId = 10 // Set milestone ID for testing

  it('Create a New Milestone Record for Test User', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        userId,
        milestoneId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.record).to.be.an('object').that.is.not.empty
      milestoneRecordId = response.body.record.id
      cy.log('Created Milestone Record ID:', milestoneRecordId)
    })
  })

  it('Attempt to Delete Milestone Record without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${milestoneRecordId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Delete Milestone Record with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${milestoneRecordId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  after(() => {
    if (milestoneRecordId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${milestoneRecordId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(200)
        cy.log('Cleaned up Milestone Record ID:', milestoneRecordId)
      })
    }
  })
})
