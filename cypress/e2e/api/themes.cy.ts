// cypress/e2e/themes.cy.js
/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Theme Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/themes'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let themeId: number | undefined
  const uniqueThemeName = `TestTheme-${Date.now()}`

  it('should not allow creating a theme without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: uniqueThemeName,
        values: { '--color-primary': '#ff0000', '--color-base-100': '#ffffff' },
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.be.false
      expect(res.body.message).to.contain('Invalid or expired token')
    })
  })

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
        values: { '--color-primary': '#ff0000', '--color-base-100': '#ffffff' },
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.be.false
      expect(res.body.message).to.contain('Invalid or expired token')
    })
  })

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
          '--color-primary': '#1e90ff',
          '--color-secondary': '#ff69b4',
          '--color-accent': '#ffd700',
          '--color-neutral': '#1a1a1a',
          '--color-base-100': '#ffffff',
          '--color-success': '#32cd32',
          '--color-warning': '#ffa500',
          '--color-error': '#dc143c',
        },
        tagline: 'Bold moves in basic colors.',
        room: 'splash',
        isPublic: false,
        prefersDark: true,
        colorScheme: 'dark',
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.be.true
      expect(res.body.theme).to.have.property('id')
      expect(res.body.theme.name).to.eq(uniqueThemeName)
      expect(res.body.theme.prefersDark).to.be.true
      expect(res.body.theme.colorScheme).to.eq('dark')
      themeId = res.body.theme.id
    })
  })

  it('should retrieve the created theme by ID', () => {
    cy.wrap(themeId).should('exist')
    cy.request(`${baseUrl}/${themeId}`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.name).to.eq(uniqueThemeName)
      expect(res.body.data).to.have.property('values')
      expect(res.body.data.values).to.have.property('--color-primary')
      expect(res.body.data.prefersDark).to.be.true
      expect(res.body.data.colorScheme).to.eq('dark')
    })
  })

  it('should retrieve all public themes', () => {
    cy.request(baseUrl).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.themes).to.be.an('array')
    })
  })

  it('should update a theme’s name and public status with auth', () => {
    cy.wrap(themeId).should('exist')
    cy.request({
      method: 'PATCH',
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
      expect(res.body.success).to.be.true
      expect(res.body.theme.name).to.include('Renamed-')
      expect(res.body.theme.isPublic).to.be.true
    })
  })

  it('should update theme metadata with auth', () => {
    cy.wrap(themeId).should('exist')
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${themeId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        prefersDark: false,
        colorScheme: 'light',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.theme.prefersDark).to.be.false
      expect(res.body.theme.colorScheme).to.eq('light')
    })
  })

  it('should not allow deleting a theme without authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${themeId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.be.false
      expect(res.body.message).to.include('Invalid or expired token')
    })
  })

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
      expect(res.body.message).to.include('deleted')
    })
  })
})
