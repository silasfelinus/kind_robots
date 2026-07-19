/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/api/components.cy.ts

import { adminHeaders, getApiEnv } from '../../support/api-auth'

describe('Component Management API Tests', () => {
  const uniqueFolderName = `test-folder-${Date.now()}`
  const uniqueComponentName = `TestComponent-${Date.now()}`

  let apiBase = ''
  let adminToken = ''
  let componentId: number | undefined

  before(() => {
    getApiEnv().then((env) => {
      apiBase = `${env.apiBase}/components`
      adminToken = env.adminToken
    })
  })

  after(() => {
    if (!componentId) return

    cy.request({
      method: 'DELETE',
      url: `${apiBase}/${componentId}`,
      headers: adminHeaders(adminToken),
      failOnStatusCode: false,
    }).then((response) => {
      expect(
        response.status,
        `component cleanup ${componentId}: ${JSON.stringify(response.body)}`,
      ).to.be.oneOf([200, 404])
    })
  })

  it('Get All Folder Names', () => {
    cy.request({
      method: 'GET',
      url: `${apiBase}/folders`,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Create New Component with canonical status', () => {
    cy.request({
      method: 'POST',
      url: apiBase,
      headers: adminHeaders(adminToken),
      body: {
        folderName: uniqueFolderName,
        componentName: uniqueComponentName,
        status: 'WORKING',
        title: 'Test Component',
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)

      componentId = response.body.data.id
      expect(componentId).to.be.a('number')
      expect(response.body.data.status).to.eq('WORKING')
      expect(response.body.data.isWorking).to.be.true
      expect(response.body.data.underConstruction).to.be.false
      expect(response.body.data.isBroken).to.be.false

      cy.task(
        'cypressCleanup:register',
        {
          label: `component fixture ${componentId}`,
          method: 'DELETE',
          url: `${apiBase}/${componentId}`,
          headers: adminHeaders(adminToken),
          expectedStatuses: [200, 404],
        },
        { log: false },
      )
    })
  })

  it('Get All Components', () => {
    cy.request({
      method: 'GET',
      url: apiBase,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Get Components from Specific Folder', () => {
    cy.request({
      method: 'GET',
      url: `${apiBase}/folder/${uniqueFolderName}`,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)

      const components = response.body.data as Array<{
        componentName: string
      }>

      const componentNames = components.map(
        (component) => component.componentName,
      )

      expect(componentNames).to.include(uniqueComponentName)
    })
  })

  it('Get Specific Component by ID', () => {
    expect(componentId).to.exist

    cy.request({
      method: 'GET',
      url: `${apiBase}/${componentId}`,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)

      const component = response.body.data

      expect(component.id).to.eq(componentId)
      expect(component.componentName).to.eq(uniqueComponentName)
      expect(component.folderName).to.eq(uniqueFolderName)
      expect(component.status).to.eq('WORKING')
      expect(component.isWorking).to.be.true
      expect(component.underConstruction).to.be.false
      expect(component.isBroken).to.be.false
    })
  })

  it('Rejects server-owned Component update fields', () => {
    expect(componentId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${apiBase}/${componentId}`,
      headers: adminHeaders(adminToken),
      body: {
        id: 999999,
        createdAt: new Date(0).toISOString(),
        sourceKey: 'client-owned-source-is-not-allowed',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include(
        'Unsupported Component update fields',
      )
    })
  })

  it('Updates canonical status and synchronizes legacy compatibility fields', () => {
    expect(componentId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${apiBase}/${componentId}`,
      headers: adminHeaders(adminToken),
      body: {
        status: 'NEEDS_CONTEXT',
        statusReason: 'Requires an authenticated Bot store fixture.',
        title: 'Updated Test Component',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)

      const updatedComponent = response.body.data
      expect(updatedComponent.status).to.eq('NEEDS_CONTEXT')
      expect(updatedComponent.statusReason).to.eq(
        'Requires an authenticated Bot store fixture.',
      )
      expect(updatedComponent.isWorking).to.be.false
      expect(updatedComponent.underConstruction).to.be.false
      expect(updatedComponent.isBroken).to.be.false
      expect(updatedComponent.title).to.eq('Updated Test Component')
    })
  })

  it('Keeps one explicit legacy status-write compatibility path', () => {
    expect(componentId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${apiBase}/${componentId}`,
      headers: adminHeaders(adminToken),
      body: {
        isBroken: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.status).to.eq('BROKEN')
      expect(response.body.data.isWorking).to.be.false
      expect(response.body.data.underConstruction).to.be.false
      expect(response.body.data.isBroken).to.be.true
    })
  })

  it('Delete Component with Authentication', () => {
    expect(componentId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${apiBase}/${componentId}`,
      headers: adminHeaders(adminToken),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(
        `Component with ID ${componentId} deleted successfully`,
      )

      componentId = undefined
    })
  })
})
