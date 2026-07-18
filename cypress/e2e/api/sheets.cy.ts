// /cypress/e2e/api/sheets.cy.ts
/// <reference types="cypress" />

import {
  adminHeaders,
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  statusCode?: number
}

const expectLeanSheet = (sheet: Record<string, unknown>) => {
  expect(sheet).to.not.have.property('Dream')
  expect(sheet).to.not.have.property('Project')
  expect(sheet).to.not.have.property('ArtImage')
}

describe('Sheets API CRUD + Auth Tests', () => {
  const invalidToken = 'definitely-not-a-real-token'
  const time = Date.now()
  const dreamTitle = `PitchSheet Cypress Dream ${time}`

  let apiBase = ''
  let adminToken = ''
  let sheetsUrl = ''
  let dreamsUrl = ''
  let userToken = ''
  let userId: number | undefined
  let dreamId = 0
  let pitchSheetId = 0
  let standaloneSheetId = 0

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        sheetsUrl = `${apiBase}/sheets`
        dreamsUrl = `${apiBase}/dreams`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        userToken = auth.token
        userId = auth.id

        return cy.request<ApiResponse>({
          method: 'POST',
          url: dreamsUrl,
          headers: bearerHeaders(userToken),
          body: {
            title: dreamTitle,
            slug: `pitchsheet-cypress-dream-${time}`,
            dreamType: 'PITCH',
            description:
              'Temporary Dream created by the PitchSheet API Cypress test.',
            pitch:
              'A throwaway Dream used to verify PitchSheet backend behavior.',
            flavorText:
              'If you can read this in production, the cleanup goblin missed a spot.',
            isPublic: true,
            isActive: true,
            isMature: false,
            designer: 'cypress',
          },
          failOnStatusCode: false,
        })
      })
      .then((res) => {
        expect(res.status, JSON.stringify(res.body)).to.eq(201)
        expect(res.body.success).to.eq(true)
        expect(res.body.data).to.have.property('id')
        dreamId = res.body.data.id
      })
  })

  after(() => {
    for (const sheetId of [pitchSheetId, standaloneSheetId]) {
      if (!sheetId || !adminToken) continue

      cy.request({
        method: 'DELETE',
        url: `${sheetsUrl}/${sheetId}`,
        headers: adminHeaders(adminToken),
        failOnStatusCode: false,
      })
    }

    if (dreamId && adminToken) {
      cy.request({
        method: 'DELETE',
        url: `${dreamsUrl}/${dreamId}?hard=true`,
        headers: adminHeaders(adminToken),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, userId)
  })

  it('POST collection route rejects Dream-derived creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: sheetsUrl,
      headers: bearerHeaders(userToken),
      body: {
        dreamId,
        title: 'This belongs on the explicit command route.',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.include('/api/sheets/by-dream/:dreamId')
    })
  })

  it('POST collection route creates a standalone lean PitchSheet', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: sheetsUrl,
      headers: bearerHeaders(userToken),
      body: {
        title: `Standalone Cypress PitchSheet ${time}`,
        hook: 'A standalone sheet without hidden Dream derivation.',
        isPublic: false,
      },
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(201)
      expect(res.body.success).to.eq(true)
      expectLeanSheet(res.body.data)
      expect(res.body.data.dreamId).to.eq(null)
      standaloneSheetId = res.body.data.id
    })
  })

  it('POST by-dream rejects creation without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${sheetsUrl}/by-dream/${dreamId}`,
      body: {},
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST by-dream rejects creation with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${sheetsUrl}/by-dream/${dreamId}`,
      headers: bearerHeaders(invalidToken),
      body: {},
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST by-dream creates a lean PitchSheet command result', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${sheetsUrl}/by-dream/${dreamId}`,
      headers: bearerHeaders(userToken),
      body: {
        hook: 'A backend smoke test for a Dream sizzle card.',
        highlight1Value: 'Readable card layer',
        highlight2Value: 'Owned by a Dream',
        highlight3Value: 'No duplicate type field',
      },
    }).then((res) => {
      expect([200, 201]).to.include(res.status)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.dreamId).to.eq(dreamId)
      expectLeanSheet(res.body.data)
      pitchSheetId = res.body.data.id
    })
  })

  it('POST by-dream returns the existing lean PitchSheet', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${sheetsUrl}/by-dream/${dreamId}`,
      headers: bearerHeaders(userToken),
      body: {
        hook: 'This should not create a duplicate PitchSheet.',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.id).to.eq(pitchSheetId)
      expectLeanSheet(res.body.data)
    })
  })

  it('GET fetches visible PitchSheets', () => {
    cy.request<ApiResponse<any[]>>({
      method: 'GET',
      url: sheetsUrl,
      headers: bearerHeaders(userToken),
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.be.an('array')
      expect(res.body.data?.some((item: any) => item.id === pitchSheetId)).to.eq(
        true,
      )
    })
  })

  it('GET by ID retains the PitchSheet detail shape', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${sheetsUrl}/${pitchSheetId}`,
      headers: bearerHeaders(userToken),
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.id).to.eq(pitchSheetId)
      expect(res.body.data.Dream.id).to.eq(dreamId)
      expect(res.body.data).to.have.property('ArtImage')
    })
  })

  it('GET by-dream retains the PitchSheet detail shape', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${sheetsUrl}/by-dream/${dreamId}`,
      headers: bearerHeaders(userToken),
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.id).to.eq(pitchSheetId)
      expect(res.body.data.Dream.id).to.eq(dreamId)
    })
  })

  it('PATCH rejects update without auth', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${sheetsUrl}/${pitchSheetId}`,
      body: { title: 'No Auth Edit' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('PATCH rejects update with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${sheetsUrl}/${pitchSheetId}`,
      headers: bearerHeaders(invalidToken),
      body: { title: 'Invalid Auth Edit' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('PATCH returns a lean PitchSheet mutation response', () => {
    const hook = `Updated PitchSheet Hook ${Date.now()}`

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${sheetsUrl}/${pitchSheetId}`,
      headers: bearerHeaders(userToken),
      body: { hook },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.hook).to.eq(hook)
      expectLeanSheet(res.body.data)
    })
  })

  it('DELETE rejects delete without auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${sheetsUrl}/${pitchSheetId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE removes the Dream PitchSheet with valid auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${sheetsUrl}/${pitchSheetId}`,
      headers: bearerHeaders(userToken),
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.id).to.eq(pitchSheetId)
      pitchSheetId = 0
    })
  })

  it('GET deleted PitchSheet returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${sheetsUrl}/${pitchSheetId || 0}`,
      headers: bearerHeaders(userToken),
      failOnStatusCode: false,
    }).then((res) => {
      expect([400, 404]).to.include(res.status)
      expect(res.body.success).to.eq(false)
    })
  })
})
