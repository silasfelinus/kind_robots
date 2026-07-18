import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type SmartIconRow = {
  id: number
  title: string
  type: string
  userId: number | null
  category: string | null
  modelType: string | null
  isMature: boolean
}

type SmartIconBatchData = {
  created: SmartIconRow[]
  skipped: Array<{
    title: string
    type: string
    existingId: number
    reason: string
  }>
  failed: Array<{ title: string; message: string }>
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  statusCode?: number
}

describe('SmartIcon API boundaries', () => {
  const invalidToken = 'someInvalidTokenValue'
  const stamp = Date.now()
  const iconTitle = `Icon-${stamp}`
  const batchIconTitle = `BatchIcon-${stamp}`

  let apiBase = ''
  let adminToken = ''
  let baseUrl = ''
  let userToken = ''
  let userId: number | undefined
  let iconId: number | undefined
  let batchIconId: number | undefined

  const headers = () => bearerHeaders(userToken)

  const deleteIcon = (id?: number) => {
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
        baseUrl = `${apiBase}/icons`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        userToken = auth.token
        userId = auth.id
      })
  })

  after(() => {
    deleteIcon(iconId)
    deleteIcon(batchIconId)
    deleteTestUser(apiBase, adminToken, userId)
  })

  it('rejects SmartIcon creation without authentication', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      body: {
        title: iconTitle,
        type: 'test',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects SmartIcon creation with an invalid token', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(invalidToken),
      body: {
        title: iconTitle,
        type: 'test',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('creates one SmartIcon for the authenticated user', () => {
    cy.request<ApiResponse<SmartIconRow>>({
      method: 'POST',
      url: baseUrl,
      headers: headers(),
      body: {
        title: iconTitle,
        type: 'test',
        icon: 'kind-icon:magic-hat',
        label: 'Test Label',
        link: '/test-link',
        component: 'TestComponent',
        userId: 1,
        isPublic: false,
        isMature: true,
        modelType: 'dream',
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.title).to.eq(iconTitle)
      expect(response.body.data?.userId).to.eq(userId)
      expect(response.body.data?.category).to.eq('model')
      expect(response.body.data?.modelType).to.eq('dream')
      expect(response.body.data?.isMature).to.eq(true)

      iconId = response.body.data?.id
      expect(iconId).to.be.a('number')
    })
  })

  it('returns 409 for a duplicate owner/title/type identity', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: headers(),
      body: {
        title: iconTitle,
        type: 'test',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.eq(false)
      expect(response.body.data).to.eq(null)
      expect(response.body.message).to.include('already exists')
    })
  })

  it('rejects arrays on single-resource SmartIcon POST', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: headers(),
      body: [{ title: batchIconTitle, type: 'nav' }],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('/api/icons/batch')
    })
  })

  it('uses the explicit batch route for created, skipped, and failed rows', () => {
    cy.request<ApiResponse<SmartIconBatchData>>({
      method: 'POST',
      url: `${baseUrl}/batch`,
      headers: headers(),
      body: [
        {
          title: batchIconTitle,
          type: 'nav',
          icon: 'kind-icon:compass',
          link: '/explore',
        },
        {
          title: iconTitle,
          type: 'test',
        },
        {
          title: `InvalidIcon-${stamp}`,
        },
      ],
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(207)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.created).to.have.length(1)
      expect(response.body.data?.skipped).to.have.length(1)
      expect(response.body.data?.failed).to.have.length(1)
      expect(response.body.data?.created[0].title).to.eq(batchIconTitle)
      expect(response.body.data?.created[0].userId).to.eq(userId)
      expect(response.body.data?.skipped[0].existingId).to.eq(iconId)
      expect(response.body.data?.failed[0].message).to.include('type')

      batchIconId = response.body.data?.created[0].id
    })
  })

  it('lists and retrieves SmartIcons', () => {
    cy.request<ApiResponse<SmartIconRow[]>>(baseUrl).then((listResponse) => {
      expect(listResponse.status).to.eq(200)
      expect(listResponse.body.success).to.eq(true)
      expect(listResponse.body.data?.some((icon) => icon.id === iconId)).to.eq(true)
    })

    cy.request<ApiResponse<SmartIconRow>>(`${baseUrl}/${iconId}`).then(
      (detailResponse) => {
        expect(detailResponse.status).to.eq(200)
        expect(detailResponse.body.success).to.eq(true)
        expect(detailResponse.body.data?.id).to.eq(iconId)
      },
    )
  })

  it('rejects ownership mutation through PATCH', () => {
    expect(iconId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${iconId}`,
      headers: headers(),
      body: { userId: 1 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('No valid data')
    })
  })

  it('updates whitelisted SmartIcon fields', () => {
    expect(iconId).to.exist

    const updatedTitle = `Updated-${iconTitle}`

    cy.request<ApiResponse<SmartIconRow>>({
      method: 'PATCH',
      url: `${baseUrl}/${iconId}`,
      headers: headers(),
      body: {
        title: updatedTitle,
        label: 'Updated Label',
        isMature: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.title).to.eq(updatedTitle)
      expect(response.body.data?.userId).to.eq(userId)
      expect(response.body.data?.isMature).to.eq(false)
    })
  })

  it('rejects SmartIcon deletion without authentication', () => {
    expect(iconId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${iconId}`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('deletes a SmartIcon with authentication', () => {
    expect(iconId).to.exist

    cy.request<ApiResponse<SmartIconRow>>({
      method: 'DELETE',
      url: `${baseUrl}/${iconId}`,
      headers: headers(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.id).to.eq(iconId)
      iconId = undefined
    })
  })
})
