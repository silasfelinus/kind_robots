/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/galleries.cy.js

describe('Theme Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/themes'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let themeId: number | undefined
  const uniqueThemeName = `TestTheme-${Date.now()}`

  // 1. Create theme without auth (should fail)
  it('should not allow creating a theme without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: uniqueThemeName,
        values: { primary: '#ff0000', 'base-100': '#ffffff' },
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  // 2. Create theme with invalid token (should fail)
  it('should not allow creating a theme with an invalid token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        name: uniqueThemeName,
        values: { primary: '#ff0000', 'base-100': '#ffffff' },
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  // 3. Create theme with valid token
  it('should create a new theme with valid authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        name: uniqueThemeName,
        values: {
          primary: '#1e90ff',
          secondary: '#ff69b4',
          accent: '#ffd700',
          neutral: '#1a1a1a',
          'base-100': '#ffffff',
          success: '#32cd32',
          warning: '#ffa500',
          error: '#dc143c',
        },
        tagline: 'Bold moves in basic colors.',
        isPublic: false,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.be.true
      themeId = res.body.theme.id
    })
  })

  // 4. Get theme by ID
  it('should retrieve the created theme by ID', () => {
    cy.wrap(themeId).should('exist')
    cy.request(`${baseUrl}/${themeId}`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.name).to.eq(uniqueThemeName)
    })
  })

  // 5. Get all public themes
  it('should retrieve all public themes', () => {
    cy.request(baseUrl).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.themes).to.be.an('array')
    })
  })

  // 6. Update theme visibility + name
  it('should update a theme’s name and public status with auth', () => {
    cy.wrap(themeId).should('exist')
    cy.request({
      method: 'PUT',
      url: `${baseUrl}/${themeId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        name: `Renamed-${uniqueThemeName}`,
        isPublic: true,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.theme.name).to.include('Renamed-')
      expect(res.body.theme.isPublic).to.be.true
    })
  })

  // 7. Delete theme without auth (should fail)
  it('should not allow deleting a theme without authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${themeId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  // 8. Delete theme with valid auth (should succeed)
  it('should delete a theme with valid authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${themeId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
    })
  })
})
