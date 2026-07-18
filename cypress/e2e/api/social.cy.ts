// cypress/e2e/api/social.cy.ts
import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  jsonHeaders,
} from '../../support/api-auth'

const expectLeanSocialPost = (post: Record<string, any>) => {
  expect(post).to.not.have.property('User')
  expect(post).to.not.have.property('_count')
  expect(post.targets).to.be.an('array')

  for (const target of post.targets) {
    expect(target).to.include.keys('id', 'postId', 'platform', 'status')
    expect(target).to.not.have.property('remoteUrl')
    expect(target).to.not.have.property('errorMessage')
    expect(target).to.not.have.property('publishedAt')
  }
}

describe('Social Publisher API', () => {
  const stamp = Date.now()
  const title = `Cypress social post ${stamp}`
  const invalidToken = 'definitely-not-valid'

  let apiBase = ''
  let baseUrl = ''
  let adminToken = ''
  let token = ''
  let userId = 0
  let itemId = 0
  let deletedItemId = 0

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        baseUrl = `${apiBase}/socials`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        token = auth.token
        userId = auth.id
      })
  })

  after(() => {
    if (itemId && token) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${itemId}`,
        headers: bearerHeaders(token),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, userId)
  })

  it('rejects creation without authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: jsonHeaders(),
      body: {
        title,
        body: 'This should not be created.',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
    })
  })

  it('rejects creation with invalid authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(invalidToken),
      body: {
        title,
        body: 'This should also not be created.',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
    })
  })

  it('rejects arrays on the single-resource collection route', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(token),
      body: [
        {
          title,
          body: 'Multi-create belongs in socialStore orchestration.',
        },
      ],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('creates one SocialPost')
    })
  })

  it('creates one SocialPost aggregate with bounded target summaries', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(token),
      body: {
        title,
        body: 'A Cypress-created social publisher draft.',
        mediaUrls: [
          {
            type: 'image',
            url: '/images/kindart.webp',
            alt: 'Kind Robots test art',
          },
        ],
        audience: 'SOCIAL',
        platforms: ['DISCORD', 'MASTODON'],
        isPublic: false,
        isMature: false,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data.title).to.eq(title)
      expect(response.body.data.userId).to.eq(userId)
      expect(response.body.data.targets).to.have.length(2)
      expectLeanSocialPost(response.body.data)
      itemId = response.body.data.id
    })
  })

  it('keeps full SocialTarget detail on the query route', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${itemId}`,
      headers: bearerHeaders(token),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.id).to.eq(itemId)
      expect(response.body.data.targets).to.have.length(2)
      expect(response.body.data.targets[0]).to.have.property('remoteUrl')
      expect(response.body.data.targets[0]).to.have.property('errorMessage')
      expect(response.body.data.targets[0]).to.have.property('publishedAt')
    })
  })

  it('updates the aggregate and returns bounded target summaries', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: bearerHeaders(token),
      body: {
        title: `${title} updated`,
        audience: 'COMMUNITY',
        platforms: ['DISCORD'],
        isPublic: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.title).to.eq(`${title} updated`)
      expect(response.body.data.audience).to.eq('COMMUNITY')
      expect(response.body.data.targets).to.have.length(1)
      expect(response.body.data.targets[0].platform).to.eq('DISCORD')
      expectLeanSocialPost(response.body.data)
    })
  })

  it('updates target status within the SocialPost aggregate', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: bearerHeaders(token),
      body: {
        targetUpdate: {
          platform: 'DISCORD',
          status: 'COPIED',
        },
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.targets[0]).to.include({
        platform: 'DISCORD',
        status: 'COPIED',
      })
      expectLeanSocialPost(response.body.data)
    })
  })

  it('lists the authenticated user SocialPosts', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: bearerHeaders(token),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('array')
      expect(
        response.body.data.some(
          (post: { id: number }) => post.id === itemId,
        ),
      ).to.be.true
    })
  })

  it('supports dry-run publishing without sending externally', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/${itemId}/publish`,
      headers: bearerHeaders(token),
      body: {
        dryRun: true,
        platforms: ['DISCORD'],
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.dryRun).to.eq(true)
      expect(response.body.data.variants).to.be.an('array').and.not.be.empty
    })
  })

  it('reports an unwired platform as skipped instead of failing', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: bearerHeaders(token),
      body: {
        platforms: ['MASTODON'],
      },
    })

    cy.request({
      method: 'POST',
      url: `${baseUrl}/${itemId}/publish`,
      headers: bearerHeaders(token),
      body: {
        platforms: ['MASTODON'],
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.results[0]).to.include({
        platform: 'MASTODON',
        status: 'SKIPPED',
      })
    })
  })

  it('rejects deletion without authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
    })
  })

  it('rejects deletion with invalid authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: bearerHeaders(invalidToken),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
    })
  })

  it('deletes the SocialPost aggregate', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: bearerHeaders(token),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      deletedItemId = itemId
      itemId = 0
    })
  })

  it('returns a quiet 404 after deletion', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${deletedItemId}`,
      headers: bearerHeaders(token),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(404)
      expect(response.body.success).to.be.false
    })
  })
})
