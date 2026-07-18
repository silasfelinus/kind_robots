import {
  adminHeaders,
  bearerHeaders,
  createLoggedInTestUser,
  getApiEnv,
  jsonHeaders,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type AchievementRow = {
  id: number
  label: string
  message: string
  icon: string
  karma: number
  triggerCode: string
  isActive: boolean
  isRepeatable: boolean
  artImageId: number | null
}

type AchievementBatchData = {
  created: AchievementRow[]
  skipped: Array<{
    label: string
    triggerCode: string
    existingId: number
    reason: string
  }>
  failed: Array<{ label: string; message: string }>
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  statusCode?: number
}

describe('Achievement Definition API Tests', () => {
  const stamp = Date.now()
  const triggerCode = `cypress-achievement-${stamp}`
  const batchTriggerCode = `cypress-achievement-batch-${stamp}`

  let apiBase = ''
  let baseUrl = ''
  let adminToken = ''
  let userToken = ''
  let achievementId: number | undefined
  let batchAchievementId: number | undefined

  const adminAuth = () => adminHeaders(adminToken)
  const userAuth = () => bearerHeaders(userToken)

  const deleteAchievement = (id?: number) => {
    if (!id || !adminToken) return

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${id}`,
      headers: adminAuth(),
      failOnStatusCode: false,
    })
  }

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        baseUrl = `${apiBase}/achievements`
        return createLoggedInTestUser()
      })
      .then((user) => {
        userToken = user.token
      })
  })

  after(() => {
    deleteAchievement(achievementId)
    deleteAchievement(batchAchievementId)
  })

  it('lists Achievement definitions', () => {
    cy.request<ApiResponse<AchievementRow[]>>({
      method: 'GET',
      url: baseUrl,
      headers: userAuth(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data).to.be.an('array')
    })
  })

  it('rejects definition creation without authentication', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: jsonHeaders(),
      body: {
        label: 'Unauthorized Achievement',
        message: 'This must not exist.',
        triggerCode,
        icon: 'kind-icon:lock',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects definition creation from a non-admin user', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: userAuth(),
      body: {
        label: 'User-Made Achievement Definition',
        message: 'Nope.',
        triggerCode,
        icon: 'kind-icon:nope',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('creates one Achievement definition as admin', () => {
    cy.request<ApiResponse<AchievementRow>>({
      method: 'POST',
      url: baseUrl,
      headers: adminAuth(),
      body: {
        label: 'Cypress Artist!',
        message: 'You made Art!',
        triggerCode,
        icon: 'kind-icon:palette-color',
        karma: 10,
        isRepeatable: true,
        tooltip: 'Make new Art for our Art Modeler',
        isActive: true,
        pageHint: '/artmaker',
        subtleHint: 'Go press some buttons in the art room',
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.triggerCode).to.eq(triggerCode)
      expect(response.body.data?.karma).to.eq(10)

      achievementId = response.body.data?.id
      expect(achievementId).to.be.a('number')
    })
  })

  it('returns 409 for a duplicate trigger code', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: adminAuth(),
      body: {
        label: 'Duplicate Cypress Artist',
        message: 'Duplicate.',
        triggerCode,
        icon: 'kind-icon:copy',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.eq(false)
      expect(response.body.data).to.eq(null)
    })
  })

  it('rejects arrays on the single-resource POST', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: adminAuth(),
      body: [
        {
          label: 'Wrong Endpoint Achievement',
          message: 'Use batch.',
          triggerCode: batchTriggerCode,
          icon: 'kind-icon:array',
        },
      ],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('/api/achievements/batch')
    })
  })

  it('uses the explicit batch route for created, skipped, and failed rows', () => {
    cy.request<ApiResponse<AchievementBatchData>>({
      method: 'POST',
      url: `${baseUrl}/batch`,
      headers: adminAuth(),
      body: [
        {
          label: 'Batch Cypress Achievement',
          message: 'Created in a batch.',
          triggerCode: batchTriggerCode,
          icon: 'kind-icon:batch',
          karma: 5,
        },
        {
          label: 'Duplicate Existing Achievement',
          message: 'Skipped.',
          triggerCode,
          icon: 'kind-icon:copy',
        },
        {
          label: 'Invalid Batch Achievement',
          message: '',
          triggerCode: `invalid-${stamp}`,
          icon: 'kind-icon:error',
        },
      ],
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(207)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.created).to.have.length(1)
      expect(response.body.data?.skipped).to.have.length(1)
      expect(response.body.data?.failed).to.have.length(1)
      expect(response.body.data?.created[0].triggerCode).to.eq(batchTriggerCode)

      batchAchievementId = response.body.data?.created[0].id
    })
  })

  it('prevents a non-admin from updating a definition', () => {
    expect(achievementId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${achievementId}`,
      headers: userAuth(),
      body: { label: 'Stolen Definition' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects server-owned fields during definition updates', () => {
    expect(achievementId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${achievementId}`,
      headers: adminAuth(),
      body: {
        id: 999999,
        createdAt: new Date(0).toISOString(),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported Achievement fields')
    })
  })

  it('updates whitelisted definition fields as admin', () => {
    expect(achievementId).to.exist

    cy.request<ApiResponse<AchievementRow>>({
      method: 'PATCH',
      url: `${baseUrl}/${achievementId}`,
      headers: adminAuth(),
      body: {
        label: 'Cypress Master Artist!',
        message: 'You created a masterpiece!',
        karma: 20,
        isRepeatable: false,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.label).to.eq('Cypress Master Artist!')
      expect(response.body.data?.message).to.eq(
        'You created a masterpiece!',
      )
      expect(response.body.data?.karma).to.eq(20)
      expect(response.body.data?.isRepeatable).to.eq(false)
    })
  })

  it('prevents a non-admin from deleting a definition', () => {
    expect(achievementId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${achievementId}`,
      headers: userAuth(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('deletes a definition as admin', () => {
    expect(achievementId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${achievementId}`,
      headers: adminAuth(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data).to.eq(null)
      achievementId = undefined
    })
  })
})
