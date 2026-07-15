import { createLoggedInTestUser } from '../../support/api-auth'
/* eslint-disable @typescript-eslint/no-unused-expressions */

/// <reference types="cypress" />

type ApiResponse<T = any> = {
  success: boolean
  message?: string
  data?: T
  statusCode?: number
}

type RelationType = 'FRIEND' | 'BLOCK' | 'PARENT' | 'CHILD' | 'REFEREE'
type RelationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

type UserRelation = {
  id: number
  userId: number
  relatedUserId: number
  type: RelationType
  status: RelationStatus
  pairId?: number | null
}

const fallbackApiBase = 'https://kind-robots.vercel.app'
const invalidToken = 'definitely-not-a-real-token'
const normalRequestTimeout = 20_000
const expectedFailureTimeout = 8_000
const cleanupRequestTimeout = 12_000
const relationsPath = '/api/relations'

let apiBase = fallbackApiBase
let userToken = ''
let adminToken = ''
let actorUserId = 0
let relatedUserId = 0

// This set is only a partial-run safety net. Successful inline cleanup removes
// ids immediately so after() does not spend time deleting the same rows again.
const createdRelationIds = new Set<number>()

const urlFor = (recordId?: number) =>
  recordId
    ? `${apiBase}${relationsPath}/${recordId}`
    : `${apiBase}${relationsPath}`

const userHeaders = () => ({
  Authorization: `Bearer ${userToken}`,
  'Content-Type': 'application/json',
})

const adminAuthHeaders = () => ({
  Authorization: `Bearer ${adminToken}`,
  'Content-Type': 'application/json',
})

const jsonHeaders = () => ({ 'Content-Type': 'application/json' })

type ApiRequestOptions = {
  method: string
  url: string
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
}

const apiRequest = <T = any>(options: ApiRequestOptions) =>
  cy.request<ApiResponse<T>>({
    ...options,
    timeout: options.timeout ?? normalRequestTimeout,
    failOnStatusCode: false,
    retryOnStatusCodeFailure: false,
    retryOnNetworkFailure: false,
  } as Cypress.RequestOptions)

const cleanupRequest = <T = any>(options: ApiRequestOptions) =>
  cy.request<ApiResponse<T>>({
    ...options,
    timeout: options.timeout ?? cleanupRequestTimeout,
    failOnStatusCode: false,
    retryOnStatusCodeFailure: false,
    retryOnNetworkFailure: false,
  } as Cypress.RequestOptions)

const expectSuccess = (
  response: Cypress.Response<ApiResponse>,
  statusCodes = [200, 201],
) => {
  expect(statusCodes, JSON.stringify(response.body)).to.include(response.status)
  expect(response.body.success, JSON.stringify(response.body)).to.eq(true)
  expect(response.body.data, JSON.stringify(response.body)).to.exist
}

const expectFailure = (
  response: Cypress.Response<ApiResponse>,
  statusCodes: number[],
) => {
  expect(statusCodes, JSON.stringify(response.body)).to.include(response.status)
  expect(response.body.success, JSON.stringify(response.body)).to.eq(false)
}

const expectedFailureRequest = (
  options: ApiRequestOptions,
  statusCodes: number[],
) =>
  cy
    .request<ApiResponse>({
      ...options,
      timeout: options.timeout ?? expectedFailureTimeout,
      failOnStatusCode: false,
      retryOnStatusCodeFailure: false,
      retryOnNetworkFailure: false,
    } as Cypress.RequestOptions)
    .then((response) => {
      expectFailure(response, statusCodes)
      return response
    })

const expectId = (value: unknown, label: string) => {
  expect(value, label).to.be.a('number')
  expect(value, label).to.be.greaterThan(0)
}

const track = (recordId: number) => createdRelationIds.add(recordId)
const untrack = (recordId: number) => createdRelationIds.delete(recordId)

const createRelation = (
  type: RelationType,
  target = relatedUserId,
  headers: Record<string, string> = userHeaders(),
) =>
  apiRequest<UserRelation>({
    method: 'POST',
    url: urlFor(),
    headers,
    body: { relatedUserId: target, type },
  }).then((response) => {
    expectSuccess(response)
    const row = response.body.data as UserRelation
    expectId(row.id, `relation(${type}).id`)
    track(row.id)
    return row
  })

const listRelations = (headers: Record<string, string>) =>
  apiRequest<UserRelation[]>({
    method: 'GET',
    url: urlFor(),
    headers,
  }).then((response) => {
    expectSuccess(response, [200])
    expect(response.body.data, 'relations list').to.be.an('array')
    return response.body.data as UserRelation[]
  })

const acceptRelation = (
  recordId: number,
  headers: Record<string, string> = adminAuthHeaders(),
) =>
  apiRequest<UserRelation>({
    method: 'PATCH',
    url: urlFor(recordId),
    headers,
    body: { status: 'ACCEPTED' },
  }).then((response) => {
    expectSuccess(response, [200])
    return response.body.data as UserRelation
  })

const deleteRelation = (
  recordId: number,
  headers: Record<string, string> = userHeaders(),
) =>
  cleanupRequest({
    method: 'DELETE',
    url: urlFor(recordId),
    headers,
  }).then((response) => {
    if ([200, 202, 204, 404].includes(response.status)) untrack(recordId)
    return response
  })

const findRelation = (
  rows: UserRelation[],
  type: RelationType,
  a: number,
  b: number,
) =>
  rows.find(
    (row) =>
      row.type === type &&
      ((row.userId === a && row.relatedUserId === b) ||
        (row.userId === b && row.relatedUserId === a)),
  )

describe('Friendship / UserRelation API Tests', () => {
  before(() => {
    cy.env(['API_BASE']).then((env) => {
      apiBase = String(env.API_BASE || fallbackApiBase)
    })

    createLoggedInTestUser().then((auth) => {
      userToken = auth.token
      actorUserId = auth.id

      return createLoggedInTestUser({ role: 'second' }).then((admin) => {
        adminToken = admin.token
        relatedUserId = admin.id

        expectId(actorUserId, 'actorUserId')
        expectId(relatedUserId, 'relatedUserId')
        expect(relatedUserId, 'actor and target must differ').to.not.eq(
          actorUserId,
        )
      })
    })
  })

  it('rejects unauthenticated, invalid-token, and self relations', () => {
    expectedFailureRequest(
      {
        method: 'POST',
        url: urlFor(),
        headers: jsonHeaders(),
        body: { relatedUserId, type: 'FRIEND' },
      },
      [401],
    )

    expectedFailureRequest(
      {
        method: 'POST',
        url: urlFor(),
        headers: {
          Authorization: `Bearer ${invalidToken}`,
          'Content-Type': 'application/json',
        },
        body: { relatedUserId, type: 'FRIEND' },
      },
      [401],
    )

    expectedFailureRequest(
      {
        method: 'POST',
        url: urlFor(),
        headers: userHeaders(),
        body: { relatedUserId: actorUserId, type: 'FRIEND' },
      },
      [400, 422],
    )
  })

  it('runs the complete friend request, accept, and removal lifecycle', () => {
    createRelation('FRIEND').then((pending) => {
      expect(pending).to.include({
        type: 'FRIEND',
        status: 'PENDING',
        userId: actorUserId,
        relatedUserId,
      })

      listRelations(adminAuthHeaders()).then((targetRows) => {
        const visible = findRelation(
          targetRows,
          'FRIEND',
          actorUserId,
          relatedUserId,
        )
        expect(visible?.status, 'target sees pending request').to.eq('PENDING')
      })

      expectedFailureRequest(
        {
          method: 'PATCH',
          url: urlFor(pending.id),
          headers: jsonHeaders(),
          body: { status: 'ACCEPTED' },
        },
        [401, 403],
      )

      acceptRelation(pending.id).then((accepted) => {
        expect(accepted.status).to.eq('ACCEPTED')

        listRelations(userHeaders()).then((rows) => {
          const mine = rows.find(
            (row) =>
              row.type === 'FRIEND' &&
              row.userId === actorUserId &&
              row.relatedUserId === relatedUserId,
          )
          const inverse = rows.find(
            (row) =>
              row.type === 'FRIEND' &&
              row.userId === relatedUserId &&
              row.relatedUserId === actorUserId,
          )
          expect(mine?.status).to.eq('ACCEPTED')
          expect(inverse?.status).to.eq('ACCEPTED')
          if (inverse) track(inverse.id)

          deleteRelation(mine!.id).then((response) => {
            expect([200, 202, 204]).to.include(response.status)
            if (inverse) untrack(inverse.id)
          })
        })
      })
    })
  })

  it('supports requester cancellation and target decline', () => {
    createRelation('FRIEND').then((cancelled) => {
      deleteRelation(cancelled.id).then((response) => {
        expect([200, 202, 204]).to.include(response.status)
      })
    })

    createRelation('FRIEND').then((declined) => {
      deleteRelation(declined.id, adminAuthHeaders()).then((response) => {
        expect([200, 202, 204]).to.include(response.status)
      })
    })
  })

  it('auto-accepts only mutual FRIEND requests', () => {
    createRelation('FRIEND').then((actorRow) => {
      expect(actorRow.status).to.eq('PENDING')

      createRelation('FRIEND', actorUserId, adminAuthHeaders()).then(
        (adminRow) => {
          expect(adminRow.status).to.eq('ACCEPTED')

          listRelations(userHeaders()).then((rows) => {
            const friendRows = rows.filter(
              (row) =>
                row.type === 'FRIEND' &&
                [actorUserId, relatedUserId].includes(row.userId) &&
                [actorUserId, relatedUserId].includes(row.relatedUserId),
            )
            expect(friendRows).to.have.length(2)
            expect(friendRows.every((row) => row.status === 'ACCEPTED')).to.eq(
              true,
            )

            friendRows.forEach((row) => track(row.id))
            deleteRelation(actorRow.id).then((response) => {
              expect([200, 202, 204]).to.include(response.status)
              friendRows.forEach((row) => untrack(row.id))
            })
          })
        },
      )
    })
  })

  it('keeps reverse family requests pending', () => {
    createRelation('PARENT').then((parentRow) => {
      createRelation('CHILD', actorUserId, adminAuthHeaders()).then((childRow) => {
        expect(parentRow.status).to.eq('PENDING')
        expect(childRow.status).to.eq('PENDING')

        deleteRelation(parentRow.id)
        deleteRelation(childRow.id, adminAuthHeaders())
      })
    })
  })

  it('creates the CHILD inverse only after explicit PARENT acceptance', () => {
    createRelation('PARENT').then((parentRow) => {
      acceptRelation(parentRow.id).then((accepted) => {
        expect(accepted.status).to.eq('ACCEPTED')

        listRelations(adminAuthHeaders()).then((rows) => {
          const childRow = rows.find(
            (row) =>
              row.type === 'CHILD' &&
              row.status === 'ACCEPTED' &&
              row.userId === relatedUserId &&
              row.relatedUserId === actorUserId,
          )
          expect(childRow, 'CHILD inverse created on accept').to.not.be.undefined
          if (childRow) track(childRow.id)

          deleteRelation(parentRow.id).then((response) => {
            expect([200, 202, 204]).to.include(response.status)
            if (childRow) untrack(childRow.id)
          })
        })
      })
    })
  })

  it('creates a one-directional accepted BLOCK', () => {
    createRelation('BLOCK').then((block) => {
      expect(block.status).to.eq('ACCEPTED')

      listRelations(adminAuthHeaders()).then((rows) => {
        const inverse = rows.find(
          (row) =>
            row.type === 'BLOCK' &&
            row.userId === relatedUserId &&
            row.relatedUserId === actorUserId,
        )
        expect(inverse, 'block has no inverse').to.be.undefined
      })

      deleteRelation(block.id).then((response) => {
        expect([200, 202, 204]).to.include(response.status)
      })
    })
  })

  after(() => {
    if (!userToken || createdRelationIds.size === 0) return

    for (const recordId of createdRelationIds) {
      cleanupRequest({
        method: 'DELETE',
        url: urlFor(recordId),
        headers: userHeaders(),
      }).then((response) => {
        if (response.status === 403) {
          cleanupRequest({
            method: 'DELETE',
            url: urlFor(recordId),
            headers: adminAuthHeaders(),
          })
          return
        }

        expect(
          [200, 202, 204, 404],
          `cleanup relation ${recordId}: ${JSON.stringify(response.body)}`,
        ).to.include(response.status)
      })
    }
  })
})
