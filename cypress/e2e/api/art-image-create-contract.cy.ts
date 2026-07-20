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
  imagePath: string | null
  fileName: string | null
  fileType: string | null
  isPublic: boolean
}

describe('ArtImage create and by-ids contracts', () => {
  let apiBase = ''
  let owner: TestUserAuth
  let secondUser: TestUserAuth
  let privateImage: ArtImage
  let publicImage: ArtImage

  const createImage = (
    user: TestUserAuth,
    label: string,
    isPublic: boolean,
  ) =>
    cy.request<ApiResponse<ArtImage>>({
      method: 'POST',
      url: `${apiBase}/art/image`,
      headers: bearerHeaders(user.token),
      body: {
        imagePath: `/images/test/${label}.webp`,
        path: `/images/test/${label}.webp`,
        fileName: `${label}.webp`,
        fileType: 'webp',
        promptString: `prompt for ${label}`,
        artPrompt: `art prompt for ${label}`,
        steps: 10,
        isPublic,
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

    cy.then(() => createImage(owner, `private-art-${Date.now()}`, false)).then(
      (response) => {
        expect(response.status, JSON.stringify(response.body)).to.eq(201)
        expect(response.body.success).to.eq(true)
        expect(response.body.data?.userId).to.eq(owner.id)
        expect(response.body.data?.isPublic).to.eq(false)
        privateImage = response.body.data as ArtImage

        cy.task(
          'cypressCleanup:register',
          {
            label: `Private ArtImage ${privateImage.id}`,
            method: 'DELETE',
            url: `${apiBase}/art/image/${privateImage.id}`,
            headers: bearerHeaders(owner.token),
            expectedStatuses: [200, 404],
          },
          { log: false },
        )
      },
    )

    cy.then(() => createImage(owner, `public-art-${Date.now()}`, true)).then(
      (response) => {
        expect(response.status, JSON.stringify(response.body)).to.eq(201)
        expect(response.body.data?.userId).to.eq(owner.id)
        expect(response.body.data?.isPublic).to.eq(true)
        publicImage = response.body.data as ArtImage

        cy.task(
          'cypressCleanup:register',
          {
            label: `Public ArtImage ${publicImage.id}`,
            method: 'DELETE',
            url: `${apiBase}/art/image/${publicImage.id}`,
            headers: bearerHeaders(owner.token),
            expectedStatuses: [200, 404],
          },
          { log: false },
        )
      },
    )
  })

  it('requires authentication for create', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/art/image`,
      body: { imagePath: '/images/test/anonymous.webp' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
      expect(response.body.statusCode).to.eq(401)
    })
  })

  it('rejects ownership and relationship fields during create', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/art/image`,
      headers: bearerHeaders(owner.token),
      body: {
        imagePath: '/images/test/forged.webp',
        userId: secondUser.id,
        serverId: 1,
        dreamIds: [1],
        artCollectionIds: [1],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/unsupported artimage create fields/i)
    })
  })

  it('validates create field types and bounds', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/art/image`,
      headers: bearerHeaders(owner.token),
      body: {
        imagePath: '/images/test/invalid.webp',
        steps: 0,
        isPublic: 'yes',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/steps must be an integer/i)
    })
  })

  it('returns private and public images to their owner by IDs', () => {
    cy.request<ApiResponse<ArtImage[]>>({
      method: 'POST',
      url: `${apiBase}/art/image/by-ids`,
      headers: bearerHeaders(owner.token),
      body: { ids: [privateImage.id, publicImage.id] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.map((image) => image.id)).to.have.members([
        privateImage.id,
        publicImage.id,
      ])
    })
  })

  it('hides private images but returns public images to another user', () => {
    cy.request<ApiResponse<ArtImage[]>>({
      method: 'POST',
      url: `${apiBase}/art/image/by-ids`,
      headers: bearerHeaders(secondUser.token),
      body: { ids: [privateImage.id, publicImage.id] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.map((image) => image.id)).to.deep.eq([
        publicImage.id,
      ])
    })
  })

  it('ignores userId owner-transfer on ArtImage PATCH', () => {
    // The general patch route must not reassign ownership (audit F-1). The owner
    // patches a real field alongside a userId reassignment; the field updates,
    // the owner is unchanged.
    cy.request<ApiResponse<ArtImage>>({
      method: 'PATCH',
      url: `${apiBase}/art/image/${privateImage.id}`,
      headers: bearerHeaders(owner.token),
      body: {
        artPrompt: 'owner-transfer attempt',
        userId: secondUser.id,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(owner.id)
    })
  })

  it('rejects a missing Server relation on ArtImage PATCH', () => {
    // The connect target is existence + permission gated (audit F-2 residual);
    // a nonexistent serverId is a 404 before any write.
    cy.request<ApiResponse<ArtImage>>({
      method: 'PATCH',
      url: `${apiBase}/art/image/${privateImage.id}`,
      headers: bearerHeaders(owner.token),
      body: {
        artPrompt: 'relation gate probe',
        serverId: 999_999_999,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(404)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.include('Server not found')
    })
  })

  it('requires authentication and bounded positive IDs for batch lookup', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/art/image/by-ids`,
      body: { ids: [publicImage.id] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/art/image/by-ids`,
      headers: bearerHeaders(owner.token),
      body: { ids: [0, 'not-an-id'] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/positive integers/i)
    })
  })
})
