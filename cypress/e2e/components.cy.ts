/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/components.cy.ts

describe('Component Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/components'
  const apiKey = Cypress.env('API_KEY')
  let componentId: number
  const uniqueFolderName = `test-folder-${Date.now()}`
  const uniqueComponentName = `TestComponent-${Date.now()}`

  it('Get All Folder Names', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/folders`,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.folderNames)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Create New Component', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        folderName: uniqueFolderName,
        componentName: uniqueComponentName,
        isWorking: true,
        underConstruction: false,
        isBroken: false,
        title: 'Test Component',
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      componentId = response.body.component.id
    })
  })

  it('Get All Components', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.components)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Get Components from Specific Folder', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/folder/${uniqueFolderName}`,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      const components = response.body.components as Array<{
        componentName: string
      }>
      const componentNames = components.map(
        (component) => component.componentName,
      )
      expect(componentNames).to.include(uniqueComponentName)
    })
  })

  it('Get Specific Component by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${componentId}`,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      const component = response.body.component
      expect(component.id).to.eq(componentId)
      expect(component.componentName).to.eq(uniqueComponentName)
      expect(component.folderName).to.eq(uniqueFolderName)
      expect(component.isWorking).to.be.true
      expect(component.isBroken).to.be.false
    })
  })

  it('Attempt to Update Component without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${componentId}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        isWorking: false,
        underConstruction: true,
        title: 'Unauthorized Update Attempt',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Update Component with Authentication', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${componentId}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        isWorking: false,
        underConstruction: true,
        title: 'Updated Test Component',
      },
    }).then((response) => {
      cy.log(JSON.stringify(response.body))
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      const updatedComponent = response.body.component
      expect(updatedComponent.isWorking).to.be.false
      expect(updatedComponent.underConstruction).to.be.true
      expect(updatedComponent.title).to.eq('Updated Test Component')
    })
  })

  it('Attempt to Delete Component without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${componentId}`,
      headers: {
        Accept: 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Delete Component with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${componentId}`,
      headers: {
        Accept: 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
    })
  })
})
