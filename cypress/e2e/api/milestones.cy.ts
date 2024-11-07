// cypress/e2e/milestones.cy.ts

/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Milestone Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/milestones'
  const apiKey = Cypress.env('API_KEY')
  let milestoneId: number

  it('Get All Milestones', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Create a New Milestone', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: [
        {
          label: 'Artist!',
          message: 'You made Art!',
          triggerCode: 'Artist',
          icon: 'kind-icon:palette-color',
          karma: 10,
          isRepeatable: true,
          tooltip: 'Make new Art for our Art Modeler',
          isActive: true,
          pageHint: '/artmaker',
          subtleHint: 'Go press some buttons in the art room',
        },
      ],
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data.milestones).to.be.an('array').that.is.not.empty
      milestoneId = response.body.data.milestones[0].id
    })
  })

  it('Get Milestone by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${milestoneId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.have.property('milestone')
      expect(response.body.data.milestone.label).to.eq('Artist!')
      expect(response.body.data.milestone).to.have.property('isActive')
    })
  })

  it('Update Milestone', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${milestoneId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        label: 'Master Artist!',
        message: 'You created a masterpiece!',
        karma: 20,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true

      // Verify the update
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${milestoneId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.success).to.be.true
        expect(response.body.data.milestone.label).to.eq('Master Artist!')
        expect(response.body.data.milestone.message).to.eq(
          'You created a masterpiece!',
        )
        expect(response.body.data.milestone.karma).to.eq(20)
      })
    })
  })

  it('Delete Milestone', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${milestoneId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(
        `Milestone with ID ${milestoneId} successfully deleted`,
      )
    })
  })
})
