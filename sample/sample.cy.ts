// @ts-nocheck
/* eslint-disable */
// test-ignore

// TEMPLATE: teaching copy of a Cypress API spec for the fictional Sample model.
// A real copy of this file lives at cypress/e2e/api/samples.cy.ts, where the
// relative import path for api-auth is '../../support/api-auth'.
/// <reference types="cypress" />

import {
  adminHeaders,
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  invalidBearerHeaders,
  jsonHeaders,
  type TestUserAuth,
} from '../../support/api-auth'

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  count?: number
  statusCode?: number
}

interface SampleResponse {
  id: number
  createdAt?: string
  updatedAt?: string | null
  title: string
  description?: string | null
  label?: string | null
  type?: string | null
  designer?: string | null
  isPublic: boolean
  isMature: boolean
  userId: number
}

function requireData<T>(body: ApiResponse<T>): T {
  expect(body.success, body.message || 'Expected success').to.eq(true)
  expect(body.data, body.message || 'Expected response data').to.exist

  return body.data as T
}

function requireArrayData<T>(body: ApiResponse<T[]>): T[] {
  expect(body.success, body.message || 'Expected success').to.eq(true)
  expect(body.data, body.message || 'Expected response array data').to.be.an(
    'array',
  )

  return body.data as T[]
}

describe('Sample API tests', () => {
  let apiBase = ''
  let adminToken = ''
  let user: TestUserAuth | undefined
  let publicSampleId = 0
  let privateSampleId = 0

  const time = Date.now()
  const publicSampleTitle = `Cypress Public Sample ${time}`
  const privateSampleTitle = `Cypress Private Sample ${time}`

  const samplesUrl = () => `${apiBase}/samples`

  const authHeaders = () => {
    expect(user).to.exist
    return bearerHeaders(user!.token)
  }

  const hardDeleteSample = (sampleId: number) => {
    if (!sampleId || !user) return

    cy.request<ApiResponse<SampleResponse>>({
      method: 'DELETE',
      url: `${samplesUrl()}/${sampleId}`,
      headers: authHeaders(),
      failOnStatusCode: false,
    })
  }

  const expectSampleShape = (sample: SampleResponse) => {
    expect(sample.id).to.be.a('number')
    expect(sample.title).to.be.a('string').and.not.be.empty
    expect(sample).to.have.property('description')
    expect(sample).to.have.property('label')
    expect(sample).to.have.property('type')
    expect(sample).to.have.property('designer')
    expect(sample).to.have.property('isPublic')
    expect(sample).to.have.property('isMature')
    expect(sample.userId).to.be.a('number')
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
    hardDeleteSample(publicSampleId)
    hardDeleteSample(privateSampleId)

    deleteTestUser(apiBase, adminToken, user?.id)
  })

  it('POST: rejects Sample creation without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: samplesUrl(),
      headers: jsonHeaders(),
      body: {
        title: `Unauthorized Sample ${time}`,
        description: 'This should fail.',
        userId: user?.id,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: rejects Sample creation with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: samplesUrl(),
      headers: invalidBearerHeaders(),
      body: {
        title: `Invalid Token Sample ${time}`,
        description: 'This should fail too.',
        userId: user?.id,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: rejects Sample creation without title', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: samplesUrl(),
      headers: authHeaders(),
      body: {
        description: 'No title, no sample.',
        userId: user?.id,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.match(/title/i)
    })
  })

  it('POST: creates a public Sample', () => {
    cy.request<ApiResponse<SampleResponse>>({
      method: 'POST',
      url: samplesUrl(),
      headers: authHeaders(),
      body: {
        title: publicSampleTitle,
        description: 'A Cypress-created public Sample for API testing.',
        label: 'Cypress Public Label',
        type: 'utility',
        designer: 'Cypress Designer',
        userId: user?.id,
        isPublic: true,
        isMature: false,
      },
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(201)

      const sample = requireData(res.body)

      expectSampleShape(sample)
      expect(sample.title).to.eq(publicSampleTitle)
      expect(sample.type).to.eq('utility')
      expect(sample.isPublic).to.eq(true)

      publicSampleId = sample.id
      expect(publicSampleId).to.be.a('number')
    })
  })

  it('POST: creates a private Sample', () => {
    cy.request<ApiResponse<SampleResponse>>({
      method: 'POST',
      url: samplesUrl(),
      headers: authHeaders(),
      body: {
        title: privateSampleTitle,
        description: 'A private Cypress-created Sample for ownership testing.',
        label: 'Cypress Private Label',
        type: 'test',
        userId: user?.id,
        isPublic: false,
        isMature: false,
      },
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(201)

      const sample = requireData(res.body)

      expectSampleShape(sample)
      expect(sample.title).to.eq(privateSampleTitle)
      expect(sample.isPublic).to.eq(false)

      privateSampleId = sample.id
      expect(privateSampleId).to.be.a('number')
    })
  })

  it('GET: anonymous fetch sees public Samples only', () => {
    cy.request<ApiResponse<SampleResponse[]>>({
      method: 'GET',
      url: samplesUrl(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const samples = requireArrayData(res.body)
      const publicMatch = samples.find(
        (sample) => sample.id === publicSampleId,
      )
      const privateMatch = samples.find(
        (sample) => sample.id === privateSampleId,
      )

      expect(publicMatch).to.not.eq(undefined)
      expect(privateMatch).to.eq(undefined)
    })
  })

  it('GET: authenticated fetch returns owned Samples', () => {
    cy.request<ApiResponse<SampleResponse[]>>({
      method: 'GET',
      url: samplesUrl(),
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const samples = requireArrayData(res.body)
      const ids = samples.map((sample) => sample.id)

      expect(ids).to.include(publicSampleId)
      expect(ids).to.include(privateSampleId)
    })
  })

  it('GET: fetch public Sample by ID anonymously', () => {
    cy.request<ApiResponse<SampleResponse>>({
      method: 'GET',
      url: `${samplesUrl()}/${publicSampleId}`,
    }).then((res) => {
      expect(res.status).to.eq(200)

      const sample = requireData(res.body)

      expectSampleShape(sample)
      expect(sample.id).to.eq(publicSampleId)
      expect(sample.title).to.eq(publicSampleTitle)
    })
  })

  it('GET: fetch private Sample by ID with auth', () => {
    cy.request<ApiResponse<SampleResponse>>({
      method: 'GET',
      url: `${samplesUrl()}/${privateSampleId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const sample = requireData(res.body)

      expectSampleShape(sample)
      expect(sample.id).to.eq(privateSampleId)
      expect(sample.title).to.eq(privateSampleTitle)
      expect(sample.isPublic).to.eq(false)
    })
  })

  it('GET: anonymous user cannot fetch private Sample by ID', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${samplesUrl()}/${privateSampleId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect([401, 403]).to.include(res.status)
      expect(res.body.success).to.eq(false)
    })
  })

  it('PATCH: updates public Sample fields', () => {
    const updatedTitle = `Updated ${publicSampleTitle}`

    cy.request<ApiResponse<SampleResponse>>({
      method: 'PATCH',
      url: `${samplesUrl()}/${publicSampleId}`,
      headers: authHeaders(),
      body: {
        title: updatedTitle,
        description: 'Updated by Cypress as a reusable Sample record.',
        label: 'Updated Cypress Label',
        designer: 'Updated Cypress Designer',
      },
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(200)

      const sample = requireData(res.body)

      expect(sample.title).to.eq(updatedTitle)
      expect(sample.label).to.eq('Updated Cypress Label')
      expect(sample.designer).to.eq('Updated Cypress Designer')
    })
  })

  it('DELETE: rejects delete without auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${samplesUrl()}/${publicSampleId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: rejects delete with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${samplesUrl()}/${publicSampleId}`,
      headers: invalidBearerHeaders(),
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: hard deletes public Sample', () => {
    cy.request<ApiResponse<SampleResponse>>({
      method: 'DELETE',
      url: `${samplesUrl()}/${publicSampleId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const sample = requireData(res.body)

      expect(sample.id).to.eq(publicSampleId)
      expect(res.body.message).to.match(/deleted/i)
    })
  })

  it('GET: hard-deleted public Sample returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${samplesUrl()}/${publicSampleId}`,
      headers: authHeaders(),
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: hard deletes private Sample cleanup', () => {
    cy.request<ApiResponse<SampleResponse>>({
      method: 'DELETE',
      url: `${samplesUrl()}/${privateSampleId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const sample = requireData(res.body)

      expect(sample.id).to.eq(privateSampleId)
    })
  })
})
