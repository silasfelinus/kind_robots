import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type ThemeRow = {
  id: number
  name: string
  values: Record<string, string>
  prefersDark: boolean
  colorScheme: 'light' | 'dark'
  isPublic: boolean
}

type ThemeBatchData = {
  created: ThemeRow[]
  skipped: Array<{ name: string; reason: string }>
  failed: Array<{ name: string; message: string }>
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  statusCode?: number
  count?: number
}

describe('Theme Management API Tests', () => {
  const invalidToken = 'someInvalidTokenValue'
  const stamp = Date.now()
  const uniqueThemeName = `TestTheme-${stamp}`
  const batchThemeName = `BatchTheme-${stamp}`

  let apiBase = ''
  let adminToken = ''
  let baseUrl = ''
  let userToken = ''
  let userId: number | undefined
  let themeId: number | undefined
  let batchThemeId: number | undefined

  const themeValues = {
    '--color-primary': '#1e90ff',
    '--color-secondary': '#ff69b4',
    '--color-accent': '#ffd700',
    '--color-neutral': '#1a1a1a',
    '--color-base-100': '#ffffff',
    '--color-success': '#32cd32',
    '--color-warning': '#ffa500',
    '--color-error': '#dc143c',
  }

  const headers = () => bearerHeaders(userToken)

  const deleteTheme = (id?: number) => {
    if (!id || !userToken) return

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${id}`,
      headers: headers(),
      failOnStatusCode: false,
    })
  }

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        baseUrl = `${apiBase}/themes`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        userToken = auth.token
        userId = auth.id
      })
  })

  after(() => {
    deleteTheme(themeId)
    deleteTheme(batchThemeId)
    deleteTestUser(apiBase, adminToken, userId)
  })

  it('creates one Theme with a normalized data response', () => {
    cy.request<ApiResponse<ThemeRow>>({
      method: 'POST',
      url: baseUrl,
      headers: headers(),
      body: {
        name: uniqueThemeName,
        values: themeValues,
        tagline: 'Bold moves in basic colors.',
        room: 'splash',
        isPublic: false,
        prefersDark: true,
        colorScheme: 'dark',
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body).to.not.have.property('theme')
      expect(response.body).to.not.have.property('themes')
      expect(response.body.data?.name).to.eq(uniqueThemeName)
      expect(response.body.data?.prefersDark).to.be.true
      expect(response.body.data?.colorScheme).to.eq('dark')

      themeId = response.body.data?.id
      expect(themeId).to.be.a('number')
    })
  })

  it('returns 409 for duplicate single-resource creates', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: headers(),
      body: {
        name: uniqueThemeName,
        values: themeValues,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.be.false
      expect(response.body.data).to.eq(null)
      expect(response.body.message).to.include('already exists')
    })
  })

  it('rejects arrays on single-resource Theme POST', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: headers(),
      body: [{ name: batchThemeName, values: themeValues }],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('/api/themes/batch')
    })
  })

  it('uses the explicit batch route for created, skipped, and failed rows', () => {
    cy.request<ApiResponse<ThemeBatchData>>({
      method: 'POST',
      url: `${baseUrl}/batch`,
      headers: headers(),
      body: [
        {
          name: batchThemeName,
          values: themeValues,
          colorScheme: 'light',
        },
        {
          name: uniqueThemeName,
          values: themeValues,
        },
        {
          name: `InvalidTheme-${stamp}`,
          values: ['not', 'an', 'object'],
        },
      ],
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(207)
      expect(response.body.success).to.be.false
      expect(response.body.data?.created).to.have.length(1)
      expect(response.body.data?.skipped).to.have.length(1)
      expect(response.body.data?.failed).to.have.length(1)
      expect(response.body.data?.created[0].name).to.eq(batchThemeName)
      expect(response.body.data?.skipped[0].name).to.eq(uniqueThemeName)
      expect(response.body.data?.failed[0].message).to.include('values')

      batchThemeId = response.body.data?.created[0].id
    })
  })

  it('retrieves the created Theme by ID without response aliases', () => {
    expect(themeId).to.exist

    cy.request<ApiResponse<ThemeRow>>(`${baseUrl}/${themeId}`).then(
      (response) => {
        expect(response.status).to.eq(200)
        expect(response.body.success).to.be.true
        expect(response.body).to.not.have.property('theme')
        expect(response.body.data?.name).to.eq(uniqueThemeName)
        expect(response.body.data?.values).to.have.property('--color-primary')
      },
    )
  })

  it('retrieves visible Themes through data.themes', () => {
    cy.request<ApiResponse<{ themes: ThemeRow[] }>>({
      method: 'GET',
      url: baseUrl,
      headers: headers(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body).to.not.have.property('themes')
      expect(response.body.data?.themes).to.be.an('array')
      expect(
        response.body.data?.themes.some((theme) => theme.id === themeId),
      ).to.be.true
    })
  })

  it('updates Theme metadata through data only', () => {
    expect(themeId).to.exist

    cy.request<ApiResponse<ThemeRow>>({
      method: 'PATCH',
      url: `${baseUrl}/${themeId}`,
      headers: headers(),
      body: {
        name: `Renamed-${uniqueThemeName}`,
        isPublic: true,
        prefersDark: false,
        colorScheme: 'light',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body).to.not.have.property('theme')
      expect(response.body.data?.name).to.include('Renamed-')
      expect(response.body.data?.isPublic).to.be.true
      expect(response.body.data?.prefersDark).to.be.false
      expect(response.body.data?.colorScheme).to.eq('light')
    })
  })

  it('rejects delete without authentication', () => {
    expect(themeId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${themeId}`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('rejects delete with invalid authentication', () => {
    expect(themeId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${themeId}`,
      headers: bearerHeaders(invalidToken),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
    })
  })

  it('deletes a Theme with valid authentication', () => {
    expect(themeId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${themeId}`,
      headers: headers(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include('deleted')
      themeId = undefined
    })
  })
})
