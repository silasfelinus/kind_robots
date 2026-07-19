/// <reference types="cypress" />

import {
  adminHeaders,
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  invalidBearerHeaders,
  jsonHeaders,
  type TestUserAuth,
} from '../../support/api-auth'

type CleanupResponse = Cypress.Response<unknown> | null

describe('Component Reactions API Tests', () => {
  let apiBase = ''
  let adminToken = ''
  let componentId: number | undefined
  let reactionId: number | undefined
  let testUser: TestUserAuth | undefined

  const createdComponents: number[] = []
  const createdReactions: number[] = []

  const assertDefined = <T>(value: T | undefined, name: string): T => {
    if (value === undefined) {
      throw new Error(`${name} is undefined. Test setup failed.`)
    }

    return value
  }

  const authHeaders = () => {
    expect(testUser).to.exist
    return bearerHeaders(testUser!.token)
  }

  const reactionBody = () => {
    expect(testUser).to.exist
    expect(componentId).to.exist

    return {
      userId: testUser!.id,
      reactionType: 'CLAPPED',
      reactionCategory: 'COMPONENT',
      componentId,
      comment: 'Great job on this component!',
      rating: 4,
      chatId: null,
      artImageId: null,
    }
  }

  before(() => {
    getApiEnv().then((env) => {
      apiBase = env.apiBase
      adminToken = env.adminToken
    })

    createLoggedInTestUser().then((auth) => {
      testUser = auth

      cy.request({
        method: 'POST',
        url: `${apiBase}/components`,
        headers: adminHeaders(adminToken),
        body: {
          folderName: 'test-folder',
          componentName: `TestComponent_${Date.now()}`,
          status: 'WORKING',
          title: 'Test Component',
        },
      }).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body).to.have.property('success', true)
        expect(response.body.data.status).to.eq('WORKING')
        expect(response.body.data.isWorking).to.be.true
        expect(response.body.data.underConstruction).to.be.false
        expect(response.body.data.isBroken).to.be.false

        componentId = response.body.data.id
        expect(componentId).to.be.a('number')

        const id = assertDefined(componentId, 'componentId')
        createdComponents.push(id)

        cy.task(
          'cypressCleanup:register',
          {
            label: `component-reaction fixture component ${id}`,
            method: 'DELETE',
            url: `${apiBase}/components/${id}`,
            headers: adminHeaders(adminToken),
            expectedStatuses: [200, 404],
          },
          { log: false },
        )
      })
    })
  })

  it('should not allow creating a component reaction without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/reactions`,
      headers: jsonHeaders(),
      body: reactionBody(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
    })
  })

  it('should not allow creating a component reaction with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/reactions`,
      headers: invalidBearerHeaders(),
      body: reactionBody(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
    })
  })

  it('Create a New Component Reaction with Valid Authentication', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/reactions`,
      headers: authHeaders(),
      body: reactionBody(),
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)

      reactionId = response.body.data.id
      expect(reactionId).to.be.a('number')

      const id = assertDefined(reactionId, 'reactionId')
      createdReactions.push(id)

      cy.task(
        'cypressCleanup:register',
        {
          label: `component reaction fixture ${id}`,
          method: 'DELETE',
          url: `${apiBase}/reactions/${id}`,
          headers: authHeaders(),
          expectedStatuses: [200, 404],
        },
        { log: false },
      )
    })
  })

  it("Get a Component's Reactions", () => {
    expect(componentId).to.exist

    cy.request({
      method: 'GET',
      url: `${apiBase}/reactions/component/${componentId}`,
      headers: authHeaders(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Get Reaction by ID', () => {
    expect(reactionId).to.exist

    cy.request({
      method: 'GET',
      url: `${apiBase}/reactions/${reactionId}`,
      headers: authHeaders(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)

      const reaction = response.body.data
      expect(reaction.id).to.eq(reactionId)
      expect(reaction.componentId).to.eq(componentId)
      expect(reaction.userId).to.eq(testUser!.id)
      expect(reaction.comment).to.eq('Great job on this component!')
      expect(reaction.rating).to.eq(4)
    })
  })

  it('Update an Existing Component Reaction with Valid and Invalid Authentication', () => {
    expect(reactionId).to.exist

    const patchBody = {
      reactionType: 'BOOED',
      comment: 'Actually, I have second thoughts...',
      rating: 2,
    }

    cy.request({
      method: 'PATCH',
      url: `${apiBase}/reactions/${reactionId}`,
      headers: jsonHeaders(),
      body: patchBody,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
    })

    cy.request({
      method: 'PATCH',
      url: `${apiBase}/reactions/${reactionId}`,
      headers: invalidBearerHeaders(),
      body: patchBody,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
    })

    cy.request({
      method: 'PATCH',
      url: `${apiBase}/reactions/${reactionId}`,
      headers: authHeaders(),
      body: patchBody,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.reactionType).to.eq('BOOED')
      expect(response.body.data.comment).to.eq(
        'Actually, I have second thoughts...',
      )
      expect(response.body.data.rating).to.eq(2)
    })
  })

  it('Delete a Component Reaction with Valid and Invalid Authentication', () => {
    expect(reactionId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${apiBase}/reactions/${reactionId}`,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
    })

    cy.request({
      method: 'DELETE',
      url: `${apiBase}/reactions/${reactionId}`,
      headers: invalidBearerHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
    })

    cy.request({
      method: 'DELETE',
      url: `${apiBase}/reactions/${reactionId}`,
      headers: authHeaders(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(
        `Reaction with ID ${reactionId} successfully deleted.`,
      )

      reactionId = undefined
      createdReactions.length = 0
    })
  })

  after(() => {
    if (testUser) {
      cy.wrap(createdReactions).each((id) => {
        cy.request({
          method: 'DELETE',
          url: `${apiBase}/reactions/${id}`,
          headers: authHeaders(),
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.be.oneOf([200, 404])
        })
      })

      cy.wrap(createdComponents).each((id) => {
        cy.request({
          method: 'DELETE',
          url: `${apiBase}/components/${id}`,
          headers: adminHeaders(adminToken),
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.be.oneOf([200, 404])
        })
      })
    }

    const cleanup = deleteTestUser(
      apiBase,
      adminToken,
      testUser?.id,
    ) as Cypress.Chainable<CleanupResponse>

    cleanup.then((response: CleanupResponse) => {
      if (response) {
        cy.log(
          'Component reaction test user cleanup:',
          JSON.stringify(response.body),
        )
      }
    })
  })
})
