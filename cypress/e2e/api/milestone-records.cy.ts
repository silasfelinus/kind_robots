// cypress/e2e/api/milestone-records.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */

type ApiResponse<T = unknown> = {
  success: boolean
  message?: string
  data?: T
  user?: {
    id?: number
    token?: string
  }
  token?: string
}

describe('Milestone Record Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api'
  const recordsUrl = `${baseUrl}/milestones/records`
  const usersUrl = `${baseUrl}/users`
  const milestoneId = 10
  const invalidToken = 'invalidTokenValue'

  let adminToken = ''
  let milestoneRecordId: number | undefined
  let createdUserId: number | undefined
  let createdUserToken: string | undefined
  let uniqueUsername = ''
  const testPassword = 'testpassword123'

  const jsonHeaders = () => ({
    Accept: 'application/json',
    'Content-Type': 'application/json',
  })

  const betaAdminHeaders = () => ({
    ...jsonHeaders(),
    'x-beta-admin-token': adminToken,
  })

  const bearerHeaders = (token: string) => ({
    ...jsonHeaders(),
    Authorization: `Bearer ${token}`,
  })

  const extractToken = (body: ApiResponse): string => {
    return String(
      body.data && typeof body.data === 'object' && 'token' in body.data
        ? body.data.token
        : body.token ||
            body.user?.token ||
            (body.data &&
            typeof body.data === 'object' &&
            'user' in body.data &&
            body.data.user &&
            typeof body.data.user === 'object' &&
            'token' in body.data.user
              ? body.data.user.token
              : ''),
    )
  }

  before(() => {
    cy.env(['BETA_ADMIN_TOKEN', 'API_KEY']).then((env) => {
      adminToken = String(env.BETA_ADMIN_TOKEN || env.API_KEY || '')

      expect(adminToken, 'BETA_ADMIN_TOKEN or API_KEY').to.be.a('string').and.not
        .be.empty
    })

    uniqueUsername = `testuser${Date.now()}`
    const userEmail = `${uniqueUsername}@kindrobots.org`

    cy.request<ApiResponse>({
      method: 'POST',
      url: `${usersUrl}/register`,
      headers: betaAdminHeaders(),
      body: {
        username: uniqueUsername,
        email: userEmail,
        password: testPassword,
      },
      failOnStatusCode: false,
    })
      .then((response) => {
        expect(response.status).to.be.oneOf([200, 201])
        expect(response.body).to.have.property('success', true)

        createdUserId =
          response.body.user?.id ||
          (response.body.data &&
          typeof response.body.data === 'object' &&
          'id' in response.body.data
            ? Number(response.body.data.id)
            : undefined)

        expect(createdUserId, 'created user id').to.be.a('number')
      })
      .then(() => {
        return cy.request<ApiResponse>({
          method: 'POST',
          url: `${baseUrl}/auth/login`,
          headers: jsonHeaders(),
          body: {
            username: uniqueUsername,
            password: testPassword,
          },
          failOnStatusCode: false,
        })
      })
      .then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)

        const token = extractToken(response.body)

        expect(token, 'created user JWT')
          .to.be.a('string')
          .and.have.length.greaterThan(10)

        createdUserToken = token
      })
  })

  it('should not allow creating a milestone record without an authorization token', () => {
    expect(createdUserId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: recordsUrl,
      headers: jsonHeaders(),
      body: {
        userId: createdUserId,
        milestoneId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message || '').to.match(
        /authorization token|invalid or expired/i,
      )
    })
  })

  it('should not allow creating a milestone record with an invalid authorization token', () => {
    expect(createdUserId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: recordsUrl,
      headers: bearerHeaders(invalidToken),
      body: {
        userId: createdUserId,
        milestoneId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message || '').to.match(/invalid or expired/i)
    })
  })

  it('Create a New Milestone Record for the New User with Valid Authentication', () => {
    expect(createdUserId).to.exist
    expect(createdUserToken).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse<{ id: number }>>({
      method: 'POST',
      url: recordsUrl,
      headers: bearerHeaders(createdUserToken as string),
      body: {
        userId: createdUserId,
        milestoneId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty

      milestoneRecordId = response.body.data?.id

      expect(milestoneRecordId).to.be.a('number')
    })
  })

  it('Attempt to Delete Milestone Record without Authentication (expect failure)', () => {
    expect(milestoneRecordId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${recordsUrl}/${milestoneRecordId}`,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message || '').to.match(
        /authorization token|invalid or expired/i,
      )
    })
  })

  it('Attempt to Delete Milestone Record with Invalid Token (expect failure)', () => {
    expect(milestoneRecordId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${recordsUrl}/${milestoneRecordId}`,
      headers: bearerHeaders(invalidToken),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message || '').to.match(/invalid or expired/i)
    })
  })

  it('Delete Milestone Record with Authentication', () => {
    expect(milestoneRecordId).to.exist
    expect(createdUserToken).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${recordsUrl}/${milestoneRecordId}`,
      headers: bearerHeaders(createdUserToken as string),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message || '').to.include(
        `Milestone Record with ID ${milestoneRecordId} successfully deleted`,
      )

      cy.log('Deleted Milestone Record ID:', String(milestoneRecordId))
      milestoneRecordId = undefined
    })
  })

  after(() => {
    cy.then(() => {
      if (!createdUserId || !adminToken) {
        return
      }

      cy.request<ApiResponse>({
        method: 'DELETE',
        url: `${usersUrl}/${createdUserId}`,
        headers: betaAdminHeaders(),
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 404])

        if (response.status === 200) {
          expect(response.body).to.have.property('success', true)
          cy.log(`User with ID ${createdUserId} successfully deleted`)
        } else {
          cy.log(
            `User deletion failed or already deleted. Status: ${response.status}`,
          )
        }
      })
    })
  })
})
