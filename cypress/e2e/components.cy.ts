/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Component Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/components'
  let componentId: number // Store component ID for further operations
  const uniqueFolderName = `test-folder-${Date.now()}` // Unique folder name for each test run
  const uniqueComponentName = `TestComponent-${Date.now()}` // Unique component name for each test run

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
        Tags: {
          create: [
            {
              label: 'vue',
              title: 'Vue Component Tag',
              isMature: false,
            },
            {
              label: 'component',
              title: 'Component Tag',
              isMature: false,
            },
          ],
        },
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      componentId = response.body.newComponent.id // Save the component ID for use in later tests
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
      expect(response.body.components)
        .to.be.an('array')
        .and.include(uniqueComponentName)
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
      expect(response.body.component).to.exist

      const component = response.body.component
      expect(component.id).to.eq(componentId)
      expect(component.componentName).to.eq(uniqueComponentName)
      expect(component.folderName).to.eq(uniqueFolderName)
      expect(component.isWorking).to.be.true
      expect(component.isBroken).to.be.false
    })
  })

  it('Update Specific Component by ID', () => {
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
        title: 'Updated Test Component',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.updatedComponent.isWorking).to.be.false
      expect(response.body.updatedComponent.underConstruction).to.be.true
      expect(response.body.updatedComponent.title).to.eq(
        'Updated Test Component',
      )
    })
  })

  it('Delete Specific Component by ID', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${componentId}`,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
    })
  })
})
