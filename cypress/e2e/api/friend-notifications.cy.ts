import { createLoggedInTestUser } from '../../support/api-auth'

/// <reference types="cypress" />

type ApiResponse<T = unknown> = {
  success: boolean
  message?: string
  data?: T
}

type UserRelation = {
  id: number
  userId: number
  relatedUserId: number
  type: 'FRIEND'
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  pairId?: number | null
}

type Notification = {
  id: number
  userId: number
  type: string
  actorId?: number | null
  entityId?: number | null
}

type NotificationInbox = {
  items: Notification[]
  unreadCount: number
}

type TestUser = {
  id: number
  token: string
}

const fallbackApiBase = 'https://kind-robots.vercel.app'
const relationIds = new Set<number>()

let apiBase = fallbackApiBase
let requester: TestUser
let recipient: TestUser

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
})

const requestFriend = (from: TestUser, to: TestUser) =>
  cy
    .request<ApiResponse<UserRelation>>({
      method: 'POST',
      url: `${apiBase}/api/relations`,
      headers: headersFor(from.token),
      body: { relatedUserId: to.id, type: 'FRIEND' },
      failOnStatusCode: false,
    })
    .then((response) => {
      expect([200, 201], JSON.stringify(response.body)).to.include(response.status)
      expect(response.body.success, JSON.stringify(response.body)).to.eq(true)
      expect(response.body.data, JSON.stringify(response.body)).to.exist
      const relation = response.body.data as UserRelation
      relationIds.add(relation.id)
      return relation
    })

const acceptFriend = (relationId: number, token: string) =>
  cy.request<ApiResponse<UserRelation>>({
    method: 'PATCH',
    url: `${apiBase}/api/relations/${relationId}`,
    headers: headersFor(token),
    body: { status: 'ACCEPTED' },
    failOnStatusCode: false,
  })

const deleteRelation = (relationId: number, token: string) =>
  cy
    .request<ApiResponse>({
      method: 'DELETE',
      url: `${apiBase}/api/relations/${relationId}`,
      headers: headersFor(token),
      failOnStatusCode: false,
    })
    .then((response) => {
      if ([200, 202, 204, 404].includes(response.status)) {
        relationIds.delete(relationId)
      }
      return response
    })

const loadNotifications = (token: string) =>
  cy
    .request<ApiResponse<NotificationInbox>>({
      method: 'GET',
      url: `${apiBase}/api/notifications`,
      headers: headersFor(token),
      failOnStatusCode: false,
    })
    .then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success, JSON.stringify(response.body)).to.eq(true)
      return response.body.data as NotificationInbox
    })

const findFriendRequest = (inbox: NotificationInbox, actorId: number) =>
  inbox.items.find(
    (notification) =>
      notification.type === 'FRIEND_REQUEST' && notification.actorId === actorId,
  )

describe('Friend request notification lifecycle', () => {
  before(() => {
    cy.env(['API_BASE']).then((env) => {
      apiBase = String(env.API_BASE || fallbackApiBase).replace(/\/+$/, '')
    })

    createLoggedInTestUser().then((user) => {
      requester = user
      return createLoggedInTestUser({ role: 'second' }).then((secondUser) => {
        recipient = secondUser
      })
    })
  })

  it('links and removes the notification when a request is canceled', () => {
    requestFriend(requester, recipient).then((relation) => {
      expect(relation.status).to.eq('PENDING')

      loadNotifications(recipient.token).then((inbox) => {
        const notification = findFriendRequest(inbox, requester.id)
        expect(notification, 'recipient sees friend request notification').to.exist
        expect(notification?.entityId).to.eq(relation.id)
      })

      deleteRelation(relation.id, requester.token).then((response) => {
        expect([200, 202, 204], JSON.stringify(response.body)).to.include(
          response.status,
        )

        loadNotifications(recipient.token).then((inbox) => {
          expect(
            findFriendRequest(inbox, requester.id),
            'canceled request notification is removed',
          ).to.be.undefined
        })
      })
    })
  })

  it('removes the request notification after explicit acceptance', () => {
    requestFriend(requester, recipient).then((relation) => {
      acceptFriend(relation.id, recipient.token).then((response) => {
        expect(response.status, JSON.stringify(response.body)).to.eq(200)
        expect(response.body.success, JSON.stringify(response.body)).to.eq(true)
        expect(response.body.data?.status).to.eq('ACCEPTED')

        loadNotifications(recipient.token).then((inbox) => {
          expect(
            findFriendRequest(inbox, requester.id),
            'accepted request notification is removed',
          ).to.be.undefined
        })

        deleteRelation(relation.id, requester.token).then((deleteResponse) => {
          expect([200, 202, 204], JSON.stringify(deleteResponse.body)).to.include(
            deleteResponse.status,
          )
        })
      })
    })
  })

  it('auto-accepts crossed requests and returns the caller-owned friend row', () => {
    requestFriend(requester, recipient).then((requesterRow) => {
      requestFriend(recipient, requester).then((recipientRow) => {
        expect(recipientRow.status).to.eq('ACCEPTED')
        expect(recipientRow.userId, 'response row belongs to second requester').to.eq(
          recipient.id,
        )
        expect(recipientRow.relatedUserId).to.eq(requester.id)

        loadNotifications(recipient.token).then((inbox) => {
          expect(
            findFriendRequest(inbox, requester.id),
            'crossed request notification is removed',
          ).to.be.undefined
        })

        deleteRelation(recipientRow.id, recipient.token).then((response) => {
          expect([200, 202, 204], JSON.stringify(response.body)).to.include(
            response.status,
          )
          relationIds.delete(requesterRow.id)
        })
      })
    })
  })

  after(() => {
    for (const relationId of relationIds) {
      deleteRelation(relationId, requester.token).then((response) => {
        if (response.status === 403) {
          deleteRelation(relationId, recipient.token)
        }
      })
    }
  })
})
