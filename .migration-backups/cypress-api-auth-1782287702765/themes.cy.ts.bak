// cypress/e2e/api/themes.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Theme Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/themes'
  const invalidToken = 'someInvalidTokenValue'
  const uniqueThemeName = `TestTheme-${Date.now()}`

  let userToken = ''
  let themeId: number | undefined

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
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

      expect(themeId).to.be.a('number')
    })
  })

  it('should retrieve the created theme by ID', () => {
    expect(themeId).to.exist

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
    expect(themeId).to.exist

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
    expect(themeId).to.exist

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
    expect(themeId).to.exist

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

  it('should not allow deleting a theme with invalid authentication', () => {
    expect(themeId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${themeId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.be.false
      expect(res.body.message).to.include('Invalid or expired token')
    })
  })

  it('should delete a theme with valid authentication', () => {
    expect(themeId).to.exist

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

      themeId = undefined
    })
  })
})
