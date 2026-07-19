import {
  bearerHeaders,
  createLoggedInTestUser,
  getApiEnv,
  type TestUserAuth,
} from '../../support/api-auth'

type ApiResponse<T = unknown> = {
  success?: boolean
  message?: string
  data?: T
  statusCode?: number
}

type ArtImage = {
  id: number
  userId: number | null
}

type ArtCollection = {
  id: number
  userId: number | null
  label: string
}

const ONE_PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2ZQAAAABJRU5ErkJggg=='

function pngBlob(): Blob {
  const bytes = Uint8Array.from(atob(ONE_PIXEL_PNG), (char) => char.charCodeAt(0))
  return new Blob([bytes], { type: 'image/png' })
}

function uploadImage(apiBase: string, user: TestUserAuth) {
  return cy.then(async () => {
    const formData = new FormData()
    formData.append('image', pngBlob(), 'connection-owner.png')
    formData.append('galleryName', 'cypressConnections')

    const response = await fetch(`${apiBase}/art/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
      body: formData,
    })

    const body = (await response.json()) as ApiResponse<ArtImage>
    expect(response.status, JSON.stringify(body)).to.eq(201)
    expect(body.success).to.eq(true)
    expect(body.data?.userId).to.eq(user.id)
    return body.data as ArtImage
  })
}

function createCollection(apiBase: string, user: TestUserAuth, label: string) {
  return cy
    .request<ApiResponse<ArtCollection>>({
      method: 'POST',
      url: `${apiBase}/art/collection`,
      headers: bearerHeaders(user.token),
      body: {
        label,
        isPublic: true,
      },
      failOnStatusCode: false,
    })
    .then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(user.id)
      return response.body.data as ArtCollection
    })
}

describe('ArtImage collection connection ownership', () => {
  let apiBase = ''
  let owner: TestUserAuth
  let secondUser: TestUserAuth
  let image: ArtImage
  let ownerCollection: ArtCollection
  let secondCollection: ArtCollection

  before(() => {
    getApiEnv().then((env) => {
      apiBase = env.apiBase
      cy.visit(new URL(apiBase).origin)
    })

    createLoggedInTestUser().then((auth) => {
      owner = auth
    })

    createLoggedInTestUser({ role: 'second' }).then((auth) => {
      secondUser = auth
    })

    cy.then(() => uploadImage(apiBase, owner)).then((createdImage) => {
      image = createdImage

      cy.task(
        'cypressCleanup:register',
        {
          label: `ArtImage connection test ${image.id}`,
          method: 'DELETE',
          url: `${apiBase}/art/image/${image.id}`,
          headers: bearerHeaders(owner.token),
          expectedStatuses: [200, 404],
        },
        { log: false },
      )
    })

    cy.then(() =>
      createCollection(apiBase, owner, `owner-collection-${Date.now()}`),
    ).then((collection) => {
      ownerCollection = collection

      cy.task(
        'cypressCleanup:register',
        {
          label: `Owner art collection ${collection.id}`,
          method: 'DELETE',
          url: `${apiBase}/art/collection/${collection.id}`,
          headers: bearerHeaders(owner.token),
          expectedStatuses: [200, 404],
        },
        { log: false },
      )
    })

    cy.then(() =>
      createCollection(apiBase, secondUser, `second-collection-${Date.now()}`),
    ).then((collection) => {
      secondCollection = collection

      cy.task(
        'cypressCleanup:register',
        {
          label: `Second art collection ${collection.id}`,
          method: 'DELETE',
          url: `${apiBase}/art/collection/${collection.id}`,
          headers: bearerHeaders(secondUser.token),
          expectedStatuses: [200, 404],
        },
        { log: false },
      )
    })
  })

  it('requires authentication', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/art/image/connections/${image.id}`,
      body: { artCollectionIds: [ownerCollection.id] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects ownership transfer and unrelated relationship fields', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/art/image/connections/${image.id}`,
      headers: bearerHeaders(owner.token),
      body: {
        userId: secondUser.id,
        dreamIds: [1],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/collection membership only/i)
    })
  })

  it('prevents another user from changing the image collections', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/art/image/connections/${image.id}`,
      headers: bearerHeaders(secondUser.token),
      body: { artCollectionIds: [secondCollection.id] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('prevents an image owner from adding to somebody else’s collection', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/art/image/connections/${image.id}`,
      headers: bearerHeaders(owner.token),
      body: { artCollectionIds: [secondCollection.id] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/your own collections/i)
    })
  })

  it('connects an owned image to an owned collection', () => {
    cy.request<ApiResponse<ArtImage>>({
      method: 'PATCH',
      url: `${apiBase}/art/image/connections/${image.id}`,
      headers: bearerHeaders(owner.token),
      body: { artCollectionIds: [ownerCollection.id] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.id).to.eq(image.id)
      expect(response.body.data?.userId).to.eq(owner.id)
    })
  })

  it('disconnects the owned image from a collection', () => {
    cy.request<ApiResponse<ArtImage>>({
      method: 'PATCH',
      url: `${apiBase}/art/image/connections/${image.id}`,
      headers: bearerHeaders(owner.token),
      body: { disconnectArtCollectionIds: [ownerCollection.id] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(owner.id)
    })
  })

  it('rejects contradictory collection operations', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/art/image/connections/${image.id}`,
      headers: bearerHeaders(owner.token),
      body: {
        artCollectionIds: [ownerCollection.id],
        disconnectArtCollectionIds: [ownerCollection.id],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/connected and disconnected/i)
    })
  })
})
