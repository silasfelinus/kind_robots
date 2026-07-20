import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type SheetRow = {
  id: number
  userId: number | null
  dreamId: number | null
  title: string
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  statusCode?: number
}

describe('PitchSheet mutation input boundary', () => {
  const stamp = Date.now()

  let apiBase = ''
  let adminToken = ''
  let sheetsUrl = ''
  let ownerToken = ''
  let ownerId: number | undefined
  let sheetId: number | undefined

  const ownerHeaders = () => bearerHeaders(ownerToken)

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        sheetsUrl = `${apiBase}/sheets`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((owner) => {
        ownerToken = owner.token
        ownerId = owner.id
      })
  })

  after(() => {
    if (sheetId && ownerToken) {
      cy.request({
        method: 'DELETE',
        url: `${sheetsUrl}/${sheetId}`,
        headers: ownerHeaders(),
        failOnStatusCode: false,
      }).then(() => {
        sheetId = undefined
      })
    }

    deleteTestUser(apiBase, adminToken, ownerId)
  })

  it('creates a standalone PitchSheet under the authenticated owner', () => {
    expect(ownerId).to.exist

    cy.request<ApiResponse<SheetRow>>({
      method: 'POST',
      url: sheetsUrl,
      headers: ownerHeaders(),
      body: {
        title: `BoundarySheet-${stamp}`,
        subtitle: 'A standalone pitch sheet fixture.',
        extraData: JSON.stringify({ dreamCycle: false }),
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(ownerId)
      expect(response.body.data?.dreamId).to.eq(null)

      sheetId = response.body.data?.id
      expect(sheetId).to.be.a('number')
    })
  })

  it('rejects unknown fields on standalone PitchSheet creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: sheetsUrl,
      headers: ownerHeaders(),
      body: {
        title: `UnknownFieldSheet-${stamp}`,
        bogusField: 'nope',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported PitchSheet fields')
    })
  })

  it('rejects an invalid artImageId and non-string extraData on PitchSheet creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: sheetsUrl,
      headers: ownerHeaders(),
      body: {
        title: `InvalidArtImageSheet-${stamp}`,
        artImageId: 0,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('positive integer or null')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: sheetsUrl,
      headers: ownerHeaders(),
      body: {
        title: `NonStringExtraDataSheet-${stamp}`,
        extraData: { dreamCycle: true },
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('serialized JSON string')
    })
  })

  it('rejects unknown fields on PitchSheet PATCH', () => {
    expect(sheetId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${sheetsUrl}/${sheetId}`,
      headers: ownerHeaders(),
      body: { createdAt: new Date().toISOString(), bogusField: 'nope' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('Unsupported PitchSheet fields')
    })
  })

  it('tolerates round-tripped system fields on PitchSheet PATCH', () => {
    expect(sheetId).to.exist
    expect(ownerId).to.exist

    // The broad SheetUpdatePayload can echo server-owned fields; they are
    // validated and ignored rather than rejected, so the update still succeeds.
    cy.request<ApiResponse<SheetRow>>({
      method: 'PATCH',
      url: `${sheetsUrl}/${sheetId}`,
      headers: ownerHeaders(),
      body: {
        title: `BoundarySheet-${stamp}-updated`,
        userId: ownerId,
        id: sheetId,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(ownerId)
      expect(response.body.data?.title).to.eq(`BoundarySheet-${stamp}-updated`)
    })
  })
})
