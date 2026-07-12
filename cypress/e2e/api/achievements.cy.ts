// cypress/e2e/api/achievements.cy.ts

/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Achievement Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/achievements'
  // triggerCode is unique in the schema — a fixed value would collide with
  // real achievements (or leftovers from a crashed run), so mint one per run.
  const triggerCode = `cypress-achievement-${Date.now()}`

  let apiKey = ''
  let achievementId: number

  before(() => {
    cy.env(['API_KEY']).then((env) => {
      apiKey = String(env.API_KEY || '')
      expect(apiKey, 'API_KEY').to.be.a('string').and.not.be.empty
    })
  })

  it('Get All Achievements', () => {
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

  it('Create a New Achievement', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: [
        {
          label: 'Cypress Artist!',
          message: 'You made Art!',
          triggerCode,
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
      expect(response.body.data).to.be.an('array').that.is.not.empty

      achievementId = response.body.data[0].id

      expect(achievementId).to.be.a('number')
      expect(response.body.data[0].triggerCode).to.eq(triggerCode)
    })
  })

  it('Get Achievement by ID', () => {
    expect(achievementId).to.exist

    cy.request({
      method: 'GET',
      url: `${baseUrl}/${achievementId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.have.property('id')
      expect(response.body.data.label).to.eq('Cypress Artist!')
      expect(response.body.data).to.have.property('isActive')
    })
  })

  it('Update Achievement', () => {
    expect(achievementId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${achievementId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        label: 'Cypress Master Artist!',
        message: 'You created a masterpiece!',
        karma: 20,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true

      cy.request({
        method: 'GET',
        url: `${baseUrl}/${achievementId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((getResponse) => {
        expect(getResponse.status).to.eq(200)
        expect(getResponse.body.success).to.be.true
        expect(getResponse.body.data.label).to.eq('Cypress Master Artist!')
        expect(getResponse.body.data.message).to.eq(
          'You created a masterpiece!',
        )
        expect(getResponse.body.data.karma).to.eq(20)
      })
    })
  })

  it('Delete Achievement', () => {
    expect(achievementId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${achievementId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(
        `Achievement with ID ${achievementId} successfully deleted`,
      )
    })
  })
})
