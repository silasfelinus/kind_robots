import {
  apiKeyHeaders,
  bearerHeaders,
  defaultApiBase,
} from '../../support/api-auth'

type CypressApiKeyEnv = {
  API_KEY?: string
  BETA_ADMIN_TOKEN?: string
  ADMIN_TOKEN?: string
  BASE_API_URL?: string
}

describe('Stored user API key authentication', () => {
  let apiBase = defaultApiBase
  let userApiKey = ''
  let adminApiKey = ''

  before(() => {
    cy.env([
      'API_KEY',
      'BETA_ADMIN_TOKEN',
      'ADMIN_TOKEN',
      'BASE_API_URL',
    ]).then((env: CypressApiKeyEnv) => {
      apiBase = String(env.BASE_API_URL || defaultApiBase).replace(/\/+$/, '')
      userApiKey = String(env.API_KEY || '')
      adminApiKey = String(env.ADMIN_TOKEN || env.BETA_ADMIN_TOKEN || '')

      expect(userApiKey, 'CYPRESS_API_KEY user apiKey').to.not.be.empty
      expect(
        adminApiKey,
        'CYPRESS_BETA_ADMIN_TOKEN or CYPRESS_ADMIN_TOKEN admin apiKey',
      ).to.not.be.empty
    })
  })

  it('accepts a normal user apiKey through x-api-key', () => {
    cy.request({
      url: `${apiBase}/projects?mine=true&includeInactive=true`,
      headers: apiKeyHeaders(userApiKey),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success, JSON.stringify(response.body)).to.eq(true)
      expect(response.body.data).to.be.an('array')
    })
  })

  it('accepts a normal user apiKey through Bearer authentication', () => {
    cy.request({
      url: `${apiBase}/projects?mine=true&includeInactive=true`,
      headers: bearerHeaders(userApiKey),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success, JSON.stringify(response.body)).to.eq(true)
    })
  })

  it('does not elevate a normal user apiKey to admin', () => {
    cy.request({
      url: `${apiBase}/server/uptime?window=1&samples=1`,
      headers: apiKeyHeaders(userApiKey),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(403)
      expect(response.body.success, JSON.stringify(response.body)).to.eq(false)
    })
  })

  it('derives admin authority from the admin account apiKey', () => {
    cy.request({
      url: `${apiBase}/server/uptime?window=1&samples=1`,
      headers: apiKeyHeaders(adminApiKey),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success, JSON.stringify(response.body)).to.eq(true)
    })
  })

  it('rejects an unknown apiKey', () => {
    cy.request({
      url: `${apiBase}/projects?mine=true`,
      headers: apiKeyHeaders('invalid-cypress-api-key'),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(401)
      expect(response.body.success, JSON.stringify(response.body)).to.eq(false)
    })
  })
})
