describe('Folder API Tests', () => {
  // Test fetching folder names
  it('should fetch folder names successfully', () => {
    cy.request({
      method: 'GET',
      url: '/api/utils/folderNames',
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.response).to.be.an('array')
      // Check if the array contains folder names (at least one folder should exist)
      expect(response.body.response.length).to.be.greaterThan(0)
    })
  })

  // Test fallback to JSON if folder fetch fails
  it('should fall back to JSON when folder names fail', () => {
    cy.intercept('GET', '/api/utils/folderNames', { statusCode: 500 }).as(
      'getFoldersFail',
    )
    cy.request({
      method: 'GET',
      url: '/api/utils/folderNames',
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.response).to.be.an('array')
    })
  })

  // Test fetching components from a specific folder
  it('should fetch components for a valid folder', () => {
    // Replace 'example-folder' with a real folder name from your project
    const folderName = 'game'

    cy.request({
      method: 'GET',
      url: `/api/components/${folderName}`,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.response).to.be.an('array')
      // Assuming there are .vue files in the folder, there should be component names
      expect(response.body.response.length).to.be.greaterThan(0)
    })
  })

  // Test error handling when fetching components from an invalid folder
  it('should return an error for an invalid folder', () => {
    cy.request({
      method: 'GET',
      url: '/api/components/invalid-folder',
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(500)
      expect(response.body.response).to.eq('Failed to fetch component list')
    })
  })
})
