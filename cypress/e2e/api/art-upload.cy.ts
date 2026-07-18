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

type UploadedArtImage = {
  id: number
  userId: number | null
  fileType: string | null
  fileName: string | null
}

type FetchResult<T = unknown> = {
  status: number
  body: ApiResponse<T>
}

const ONE_PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2ZQAAAABJRU5ErkJggg=='

function pngBlob(): Blob {
  const bytes = Uint8Array.from(atob(ONE_PIXEL_PNG), (char) => char.charCodeAt(0))
  return new Blob([bytes], { type: 'image/png' })
}

function uploadMultipart<T>(
  apiBase: string,
  token: string,
  fields: Record<string, string> = {},
  file: Blob = pngBlob(),
): Cypress.Chainable<FetchResult<T>> {
  return cy.then(async () => {
    const formData = new FormData()
    formData.append('image', file, 'cypress-owned-upload.png')
    formData.append('galleryName', 'cypressUploads')

    for (const [name, value] of Object.entries(fields)) {
      formData.append(name, value)
    }

    const response = await fetch(`${apiBase}/art/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const body = (await response.json()) as ApiResponse<T>

    return {
      status: response.status,
      body,
    }
  })
}

describe('Art upload ownership API', () => {
  let apiBase = ''
  let user: TestUserAuth

  before(() => {
    getApiEnv().then((env) => {
      apiBase = env.apiBase
      cy.visit(new URL(apiBase).origin)
    })

    createLoggedInTestUser().then((auth) => {
      user = auth
    })
  })

  it('requires authentication before parsing multipart data', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/art/upload`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects caller-supplied ownership fields', () => {
    uploadMultipart(apiBase, user.token, {
      userId: String(user.id + 1),
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/unsupported upload fields.*userId/i)
    })
  })

  it('rejects hidden relationship mutation fields', () => {
    uploadMultipart(apiBase, user.token, {
      collectionId: '1',
      connectedModelType: 'Dream',
      connectedModelId: '1',
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/unsupported upload fields/i)
    })
  })

  it('rejects non-image multipart files', () => {
    uploadMultipart(
      apiBase,
      user.token,
      {},
      new Blob(['not an image'], { type: 'text/plain' }),
    ).then((response) => {
      expect(response.status).to.eq(415)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/png, jpeg, and webp/i)
    })
  })

  it('creates an image owned by the authenticated user', () => {
    uploadMultipart<UploadedArtImage>(apiBase, user.token, {
      designer: user.username,
      isPublic: 'false',
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.id).to.be.a('number')
      expect(response.body.data?.userId).to.eq(user.id)
      expect(response.body.data?.fileType).to.eq('png')

      const imageId = response.body.data?.id
      expect(imageId).to.be.a('number')

      cy.task(
        'cypressCleanup:register',
        {
          label: `Art upload ${imageId}`,
          method: 'DELETE',
          url: `${apiBase}/art/image/${imageId}`,
          headers: bearerHeaders(user.token),
          expectedStatuses: [200, 404],
        },
        { log: false },
      )
    })
  })
})
