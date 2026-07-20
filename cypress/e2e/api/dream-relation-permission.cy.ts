import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type IdRow = { id: number; isPublic?: boolean }

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  statusCode?: number
}

describe('Dream relation permission gate', () => {
  const stamp = Date.now()

  let apiBase = ''
  let adminToken = ''
  let dreamsUrl = ''
  let charactersUrl = ''
  let ownerToken = ''
  let otherToken = ''
  let ownerId: number | undefined
  let otherId: number | undefined
  let privateCharacterId: number | undefined
  let publicCharacterId: number | undefined
  let dreamId: number | undefined

  const ownerHeaders = () => bearerHeaders(ownerToken)
  const otherHeaders = () => bearerHeaders(otherToken)

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        dreamsUrl = `${apiBase}/dreams`
        charactersUrl = `${apiBase}/characters`
        return createLoggedInTestUser()
      })
      .then((owner) => {
        ownerToken = owner.token
        ownerId = owner.id
        return createLoggedInTestUser({ role: 'second' })
      })
      .then((other) => {
        otherToken = other.token
        otherId = other.id

        // The other user owns one private and one public Character.
        return cy
          .request<ApiResponse<IdRow>>({
            method: 'POST',
            url: charactersUrl,
            headers: otherHeaders(),
            body: { name: `PrivateChar-${stamp}`, isPublic: false },
          })
          .then((res) => {
            expect(res.status, JSON.stringify(res.body)).to.eq(201)
            privateCharacterId = res.body.data?.id
            expect(privateCharacterId).to.be.a('number')

            return cy.request<ApiResponse<IdRow>>({
              method: 'POST',
              url: charactersUrl,
              headers: otherHeaders(),
              body: { name: `PublicChar-${stamp}`, isPublic: true },
            })
          })
          .then((res) => {
            expect(res.status, JSON.stringify(res.body)).to.eq(201)
            publicCharacterId = res.body.data?.id
            expect(publicCharacterId).to.be.a('number')
          })
      })
  })

  after(() => {
    if (dreamId && ownerToken) {
      cy.request({
        method: 'DELETE',
        url: `${dreamsUrl}/${dreamId}`,
        headers: ownerHeaders(),
        failOnStatusCode: false,
      })
    }

    for (const id of [privateCharacterId, publicCharacterId]) {
      if (id && otherToken) {
        cy.request({
          method: 'DELETE',
          url: `${charactersUrl}/${id}`,
          headers: otherHeaders(),
          failOnStatusCode: false,
        })
      }
    }

    deleteTestUser(apiBase, adminToken, ownerId)
    deleteTestUser(apiBase, adminToken, otherId)
  })

  it('forbids attaching another user private Character on Dream creation', () => {
    expect(privateCharacterId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl,
      headers: ownerHeaders(),
      body: {
        title: `PrivateRelationDream-${stamp}`,
        characterIds: [privateCharacterId],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('permission to attach')
    })
  })

  it('allows attaching a public Character on Dream creation', () => {
    expect(publicCharacterId).to.exist

    cy.request<ApiResponse<IdRow>>({
      method: 'POST',
      url: dreamsUrl,
      headers: ownerHeaders(),
      body: {
        title: `PublicRelationDream-${stamp}`,
        characterIds: [publicCharacterId],
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)

      dreamId = response.body.data?.id
      expect(dreamId).to.be.a('number')
    })
  })
})
