import {
  adminHeaders,
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  jsonHeaders,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type AchievementRow = {
  id: number
  triggerCode: string
}

type AchievementRecordRow = {
  id: number
  achievementId: number
  userId: number
  username: string
  isConfirmed: boolean
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  statusCode?: number
}

describe('Achievement Record Ownership API Tests', () => {
  const stamp = Date.now()
  const triggerCode = `record-security-${stamp}`

  let apiBase = ''
  let definitionsUrl = ''
  let recordsUrl = ''
  let adminToken = ''
  let ownerToken = ''
  let otherToken = ''
  let ownerId: number | undefined
  let otherId: number | undefined
  let achievementId: number | undefined
  let recordId: number | undefined

  const adminAuth = () => adminHeaders(adminToken)
  const ownerAuth = () => bearerHeaders(ownerToken)
  const otherAuth = () => bearerHeaders(otherToken)

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        definitionsUrl = `${apiBase}/achievements`
        recordsUrl = `${apiBase}/achievements/records`
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
      })
  })

  after(() => {
    if (recordId && ownerToken) {
      cy.request({
        method: 'DELETE',
        url: `${recordsUrl}/${recordId}`,
        headers: ownerAuth(),
        failOnStatusCode: false,
      }).then(() => {
        recordId = undefined
      })
    }

    if (achievementId && adminToken) {
      cy.request({
        method: 'DELETE',
        url: `${definitionsUrl}/${achievementId}`,
        headers: adminAuth(),
        failOnStatusCode: false,
      }).then(() => {
        achievementId = undefined
      })
    }

    deleteTestUser(apiBase, adminToken, ownerId)
    deleteTestUser(apiBase, adminToken, otherId)
  })

  it('creates an admin-owned Achievement definition fixture', () => {
    cy.request<ApiResponse<AchievementRow>>({
      method: 'POST',
      url: definitionsUrl,
      headers: adminAuth(),
      body: {
        label: 'Cypress Record Security',
        message: 'Awarded by the record ownership suite.',
        triggerCode,
        icon: 'kind-icon:shield-check',
        karma: 1,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.triggerCode).to.eq(triggerCode)

      achievementId = response.body.data?.id
      expect(achievementId).to.be.a('number')
    })
  })

  it('rejects record reads without authentication', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: recordsUrl,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
      expect(response.body.data).to.deep.eq([])
    })
  })

  it('rejects record creation without authentication', () => {
    expect(achievementId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: recordsUrl,
      headers: jsonHeaders(),
      body: { achievementId },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects caller-supplied record identity', () => {
    expect(achievementId).to.exist
    expect(otherId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: recordsUrl,
      headers: ownerAuth(),
      body: {
        achievementId,
        userId: otherId,
        username: 'definitely-not-the-owner',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include(
        'User identity comes from authentication',
      )
    })
  })

  it('creates a record for the authenticated owner', () => {
    expect(achievementId).to.exist
    expect(ownerId).to.exist

    cy.request<ApiResponse<AchievementRecordRow>>({
      method: 'POST',
      url: recordsUrl,
      headers: ownerAuth(),
      body: { achievementId },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.achievementId).to.eq(achievementId)
      expect(response.body.data?.userId).to.eq(ownerId)
      expect(response.body.data?.isConfirmed).to.eq(false)

      recordId = response.body.data?.id
      expect(recordId).to.be.a('number')
    })
  })

  it('treats duplicate awards as idempotent success', () => {
    expect(achievementId).to.exist
    expect(recordId).to.exist

    cy.request<ApiResponse<AchievementRecordRow>>({
      method: 'POST',
      url: recordsUrl,
      headers: ownerAuth(),
      body: { achievementId },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.id).to.eq(recordId)
      expect(response.body.message).to.include('already recorded')
    })
  })

  it('returns only the authenticated user records', () => {
    expect(recordId).to.exist

    cy.request<ApiResponse<AchievementRecordRow[]>>({
      method: 'GET',
      url: recordsUrl,
      headers: ownerAuth(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.some((record) => record.id === recordId)).to.eq(
        true,
      )
      expect(
        response.body.data?.every((record) => record.userId === ownerId),
      ).to.eq(true)
    })

    cy.request<ApiResponse<AchievementRecordRow[]>>({
      method: 'GET',
      url: recordsUrl,
      headers: otherAuth(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.some((record) => record.id === recordId)).to.eq(
        false,
      )
      expect(
        response.body.data?.every((record) => record.userId === otherId),
      ).to.eq(true)
    })
  })

  it('prevents another user from updating the record', () => {
    expect(recordId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${recordsUrl}/${recordId}`,
      headers: otherAuth(),
      body: { isConfirmed: true },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects record identity and relation changes', () => {
    expect(recordId).to.exist
    expect(otherId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${recordsUrl}/${recordId}`,
      headers: ownerAuth(),
      body: {
        isConfirmed: true,
        userId: otherId,
        achievementId: 999999,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include(
        'Unsupported Achievement record update fields',
      )
    })
  })

  it('lets the owner confirm the record', () => {
    expect(recordId).to.exist

    cy.request<ApiResponse<AchievementRecordRow>>({
      method: 'PATCH',
      url: `${recordsUrl}/${recordId}`,
      headers: ownerAuth(),
      body: { isConfirmed: true },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.isConfirmed).to.eq(true)
      expect(response.body.data?.userId).to.eq(ownerId)
      expect(response.body.data?.achievementId).to.eq(achievementId)
    })
  })

  it('lets admins inspect all records', () => {
    expect(recordId).to.exist

    cy.request<ApiResponse<AchievementRecordRow[]>>({
      method: 'GET',
      url: recordsUrl,
      headers: adminAuth(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.some((record) => record.id === recordId)).to.eq(
        true,
      )
    })
  })

  it('prevents another user from deleting the record', () => {
    expect(recordId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${recordsUrl}/${recordId}`,
      headers: otherAuth(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('deletes the record as its owner', () => {
    expect(recordId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${recordsUrl}/${recordId}`,
      headers: ownerAuth(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.message).to.include(
        `Achievement Record with ID ${recordId} successfully deleted`,
      )
      recordId = undefined
    })
  })

  it('deletes the Achievement definition fixture', () => {
    expect(achievementId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${definitionsUrl}/${achievementId}`,
      headers: adminAuth(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      achievementId = undefined
    })
  })
})
