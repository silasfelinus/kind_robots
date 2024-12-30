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
      expect(response.body).to.have.property('success', true)
      expect(response.body.data)
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
      expect(response.body).to.have.property('success', true)
      componentId = response.body.data.id
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
      expect(response.body).to.have.property('success', true)
      expect(response.body.data)
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
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${componentId}`,
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
      expect(component.isWorking).to.be.true
      expect(component.isBroken).to.be.false
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
      expect(response.body).to.have.property('success', true)
      const updatedComponent = response.body.data
      expect(updatedComponent.isWorking).to.be.false
      expect(updatedComponent.underConstruction).to.be.true
      expect(updatedComponent.title).to.eq('Updated Test Component')
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
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(
        `Component with ID ${componentId} deleted successfully`,
      )
    })
  })
})
