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
  let batchDreamId = 0

  const time = Date.now()
  const dreamsUrl = () => `${apiBase}/dreams`
  const chatsUrl = () => `${apiBase}/chats`
  const authHeaders = () => bearerHeaders(user!.token)

  const deleteDream = (id: number) => {
    if (!id || !user) return

    cy.request({
      method: 'DELETE',
      url: `${dreamsUrl()}/${id}`,
      headers: authHeaders(),
      failOnStatusCode: false,
    })
  }

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
    deleteDream(dreamId)
    deleteDream(batchDreamId)
    deleteTestUser(apiBase, adminToken, user?.id)
  })

  // createCollection/seedStarterImages were legacy client flags this suite
  // used to send to prove the API ignored them rather than triggering
  // side-effect Chat/Collection rows. The mutation boundary (mutation.ts's
  // dreamCreateFields allowlist) has since hardened from "ignore unknown
  // fields" to "reject unknown fields with 400" — dream-input-boundary.cy.ts
  // covers that rejection path. This suite's own job is just to prove a
  // normal Dream mutation has no implicit Chat/Collection side effects, so
  // it no longer needs to send fields the API would now 400 on.
  it('creates only a Dream, with no implicit Chat or Collection side effects', () => {
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

  // addArtImageToCollection/updateNote were the same kind of legacy
  // side-effect flag as createCollection/seedStarterImages above -- not in
  // dreamPatchFields, so the API now 400s on them rather than ignoring them.
  it('updates only the Dream, with no implicit Chat or Collection side effects', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'PATCH',
      url: `${dreamsUrl()}/${dreamId}`,
      headers: authHeaders(),
      body: {
        description: 'Updated without creating a timeline chat or collection.',
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

  it('batch creation also creates only Dream rows', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'POST',
      url: `${dreamsUrl()}/batch`,
      headers: authHeaders(),
      body: [
        {
          title: `Cypress Thin Batch Dream ${time}`,
          slug: `cypress-thin-batch-dream-${time}`,
          description: 'A batch Dream used to verify mutation boundaries.',
          dreamType: 'LOCATION',
          creationSource: 'HUMAN',
          isPublic: false,
        },
      ],
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.be.an('array').with.length(1)

      const dream = res.body.data![0]!
      batchDreamId = dream.id

      expect(dream.id).to.be.a('number').and.greaterThan(0)
      expect(dream.title).to.eq(`Cypress Thin Batch Dream ${time}`)
      expect(dream.artCollectionId).to.eq(null)
      expect(dream.artImageId).to.eq(null)
      expect(dream).to.not.have.property('Chats')
      expect(dream).to.not.have.property('ArtCollection')
      expect(dream).to.not.have.property('ArtImages')
    })
  })

  it('batch creation does not create Dream chats', () => {
    cy.request<ApiResponse<ChatResponse[]>>({
      method: 'GET',
      url: `${chatsUrl()}?dreamId=${batchDreamId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data || []).to.deep.eq([])
    })
  })
})
