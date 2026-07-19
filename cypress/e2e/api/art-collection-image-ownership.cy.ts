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
  isPublic: boolean
  ArtImages?: ArtImage[]
}

describe('ArtCollection image ownership', () => {
  let apiBase = ''
  let owner: TestUserAuth
  let secondUser: TestUserAuth
  let ownerImage: ArtImage
  let foreignImage: ArtImage
  let collection: ArtCollection

  const createImage = (user: TestUserAuth, label: string) =>
    cy.request<ApiResponse<ArtImage>>({
      method: 'POST',
      url: `${apiBase}/art/image`,
      headers: bearerHeaders(user.token),
      body: {
        imagePath: `/images/test/${label}.webp`,
        path: `/images/test/${label}.webp`,
        fileName: `${label}.webp`,
        fileType: 'webp',
        promptString: `collection ownership ${label}`,
        steps: 10,
        isPublic: false,
        isMature: false,
        isActive: true,
      },
      failOnStatusCode: false,
    })

  before(() => {
    getApiEnv().then((env) => {
      apiBase = env.apiBase
    })

    createLoggedInTestUser().then((auth) => {
      owner = auth
    })

    createLoggedInTestUser({ role: 'second' }).then((auth) => {
      secondUser = auth
    })

    cy.then(() => createImage(owner, `collection-owner-${Date.now()}`)).then(
      (response) => {
        expect(response.status, JSON.stringify(response.body)).to.eq(201)
        expect(response.body.data?.userId).to.eq(owner.id)
        ownerImage = response.body.data as ArtImage

        cy.task(
          'cypressCleanup:register',
          {
            label: `ArtCollection owner image ${ownerImage.id}`,
            method: 'DELETE',
            url: `${apiBase}/art/image/${ownerImage.id}`,
            headers: bearerHeaders(owner.token),
            expectedStatuses: [200, 404],
          },
          { log: false },
        )
      },
    )

    cy.then(() =>
      createImage(secondUser, `collection-foreign-${Date.now()}`),
    ).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.data?.userId).to.eq(secondUser.id)
      foreignImage = response.body.data as ArtImage

      cy.task(
        'cypressCleanup:register',
        {
          label: `ArtCollection foreign image ${foreignImage.id}`,
          method: 'DELETE',
          url: `${apiBase}/art/image/${foreignImage.id}`,
          headers: bearerHeaders(secondUser.token),
          expectedStatuses: [200, 404],
        },
        { log: false },
      )
    })

    cy.then(() =>
      cy.request<ApiResponse<ArtCollection>>({
        method: 'POST',
        url: `${apiBase}/art/collection`,
        headers: bearerHeaders(owner.token),
        body: {
          label: `owned-collection-${Date.now()}`,
          artImageIds: [ownerImage.id],
          isPublic: false,
        },
        failOnStatusCode: false,
      }),
    ).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(owner.id)
      expect(response.body.data?.isPublic).to.eq(false)
      expect(response.body.data?.ArtImages?.map((image) => image.id)).to.include(
        ownerImage.id,
      )
      collection = response.body.data as ArtCollection

      cy.task(
        'cypressCleanup:register',
        {
          label: `Owned ArtCollection ${collection.id}`,
          method: 'DELETE',
          url: `${apiBase}/art/collection/${collection.id}`,
          headers: bearerHeaders(owner.token),
          expectedStatuses: [200, 404],
        },
        { log: false },
      )
    })
  })

  it('requires authentication for collection creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/art/collection`,
      body: { label: 'anonymous collection' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
      expect(response.body.statusCode).to.eq(401)
    })
  })

  it('rejects caller-supplied collection identity', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/art/collection`,
      headers: bearerHeaders(owner.token),
      body: {
        label: 'forged collection owner',
        userId: secondUser.id,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/unsupported artcollection fields/i)
    })
  })

  it('prevents attaching another user’s image during create', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/art/collection`,
      headers: bearerHeaders(owner.token),
      body: {
        label: 'foreign-image-create',
        artImageIds: [foreignImage.id],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/only attach your own artimages/i)
    })
  })

  it('prevents another user from patching the collection', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/art/collection/${collection.id}`,
      headers: bearerHeaders(secondUser.token),
      body: { label: 'stolen collection' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('prevents adding another user’s image', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/art/collection/${collection.id}`,
      headers: bearerHeaders(owner.token),
      body: { addArtImageIds: [foreignImage.id] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('prevents replacing membership with another user’s image', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/art/collection/${collection.id}`,
      headers: bearerHeaders(owner.token),
      body: {
        artImageIds: [foreignImage.id],
        mode: 'replace',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects unknown fields and ambiguous relationship commands', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/art/collection/${collection.id}`,
      headers: bearerHeaders(owner.token),
      body: { userId: secondUser.id },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
    })

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${apiBase}/art/collection/${collection.id}`,
      headers: bearerHeaders(owner.token),
      body: {
        artImageIds: [ownerImage.id],
        addArtImageIds: [ownerImage.id],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/cannot be combined/i)
    })
  })

  it('supports an explicit empty replacement to clear the collection', () => {
    cy.request<ApiResponse<ArtCollection>>({
      method: 'PATCH',
      url: `${apiBase}/art/collection/${collection.id}`,
      headers: bearerHeaders(owner.token),
      body: {
        artImageIds: [],
        mode: 'replace',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.ArtImages).to.deep.eq([])
    })
  })

  it('allows the owner to add their own image again', () => {
    cy.request<ApiResponse<ArtCollection>>({
      method: 'PATCH',
      url: `${apiBase}/art/collection/${collection.id}`,
      headers: bearerHeaders(owner.token),
      body: { addArtImageIds: [ownerImage.id] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.ArtImages?.map((image) => image.id)).to.include(
        ownerImage.id,
      )
    })
  })
})
