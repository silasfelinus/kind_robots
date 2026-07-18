/// <reference types="cypress" />

import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  type TestUserAuth,
} from '../../support/api-auth'

interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  statusCode?: number
}

interface DreamResponse {
  id: number
  title: string
  slug?: string | null
  description?: string | null
  artCollectionId?: number | null
  artImageId?: number | null
}

interface ChatResponse {
  id: number
  dreamId?: number | null
  content: string
}

describe('Dream mutation boundaries', () => {
  let apiBase = ''
  let adminToken = ''
  let user: TestUserAuth | undefined
  let dreamId = 0

  const time = Date.now()
  const dreamsUrl = () => `${apiBase}/dreams`
  const chatsUrl = () => `${apiBase}/chats`
  const authHeaders = () => bearerHeaders(user!.token)

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        user = auth
      })
  })

  after(() => {
    if (dreamId && user) {
      cy.request({
        method: 'DELETE',
        url: `${dreamsUrl()}/${dreamId}`,
        headers: authHeaders(),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, user?.id)
  })

  it('creates only a Dream even when legacy side-effect flags are sent', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'POST',
      url: dreamsUrl(),
      headers: authHeaders(),
      body: {
        title: `Cypress Thin Dream ${time}`,
        slug: `cypress-thin-dream-${time}`,
        description: 'A Dream used to verify mutation boundaries.',
        dreamType: 'LOCATION',
        creationSource: 'HUMAN',
        isPublic: false,
        createCollection: true,
        seedStarterImages: true,
      },
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.exist

      const dream = res.body.data!
      dreamId = dream.id

      expect(dream.id).to.be.a('number').and.greaterThan(0)
      expect(dream.title).to.eq(`Cypress Thin Dream ${time}`)
      expect(dream.artCollectionId).to.eq(null)
      expect(dream.artImageId).to.eq(null)
      expect(dream).to.not.have.property('Chats')
      expect(dream).to.not.have.property('ArtCollection')
      expect(dream).to.not.have.property('ArtImages')
    })
  })

  it('does not create a Dream chat during creation', () => {
    cy.request<ApiResponse<ChatResponse[]>>({
      method: 'GET',
      url: `${chatsUrl()}?dreamId=${dreamId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data || []).to.deep.eq([])
    })
  })

  it('updates only the Dream even when legacy side-effect fields are sent', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'PATCH',
      url: `${dreamsUrl()}/${dreamId}`,
      headers: authHeaders(),
      body: {
        description: 'Updated without creating a timeline chat or collection.',
        addArtImageToCollection: true,
        updateNote: 'This must not become a Chat row.',
      },
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data?.id).to.eq(dreamId)
      expect(res.body.data?.description).to.include('timeline chat')
      expect(res.body.data?.artCollectionId).to.eq(null)
      expect(res.body.data).to.not.have.property('Chats')
      expect(res.body.data).to.not.have.property('ArtCollection')
    })
  })

  it('does not create a Dream chat during updates', () => {
    cy.request<ApiResponse<ChatResponse[]>>({
      method: 'GET',
      url: `${chatsUrl()}?dreamId=${dreamId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data || []).to.deep.eq([])
    })
  })
})
