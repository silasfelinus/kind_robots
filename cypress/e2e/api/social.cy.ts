// /cypress/e2e/api/social.cy.ts
/// <reference types="cypress" />

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  statusCode?: number
}

describe('SocialPost API Full CRUD + Auth + Publish Tests', () => {
  const fallbackApiBase = 'https://kind-robots.vercel.app'
  const invalidToken = 'definitely-not-a-real-token'

  let apiBase = fallbackApiBase
  let baseUrl = `${fallbackApiBase}/api/socials`
  let userToken = ''
  let itemId: number

  const time = Date.now()
  const itemTitle = `SOCIAL-${time}`

  before(() => {
    cy.env(['API_BASE', 'USER_TOKEN']).then((env) => {
      apiBase = String(env.API_BASE || fallbackApiBase)
      baseUrl = `${apiBase}/api/socials`
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'cy.env("USER_TOKEN")').to.be.a('string').and.not.be.empty
    })
  })

  it('POST: rejects creation without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      body: { title: `Unauth-${itemTitle}`, body: 'no auth' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: rejects creation with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: { title: `Invalid-${itemTitle}`, body: 'bad auth' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: creates a post with targets via valid auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: itemTitle,
        body: 'Hello from **Kind Robots** social test.',
        isPublic: true,
        platforms: ['DISCORD', 'BLUESKY', 'REDDIT'],
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.have.property('id')
      expect(res.body.data.targets).to.be.an('array').and.have.length(3)
      itemId = res.body.data.id
      expect(itemId).to.be.a('number')
    })
  })

  it('GET: fetch all public records', () => {
    cy.request<ApiResponse<any[]>>({ method: 'GET', url: baseUrl }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.be.an('array')
      expect(res.body.data?.find((i: any) => i.id === itemId)).to.not.eq(undefined)
    })
  })

  it('GET: fetch record by ID with targets', () => {
    cy.request<ApiResponse>({ method: 'GET', url: `${baseUrl}/${itemId}` }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.id).to.eq(itemId)
      expect(res.body.data.targets).to.be.an('array')
    })
  })

  it('PATCH: rejects update without auth', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { title: 'No Auth Edit' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('PATCH: updates post + resyncs platforms with valid auth', () => {
    const newTitle = `Updated-${itemTitle}`
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: { title: newTitle, platforms: ['DISCORD', 'MASTODON'] },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.title).to.eq(newTitle)
      const platforms = res.body.data.targets.map((t: any) => t.platform).sort()
      expect(platforms).to.deep.eq(['DISCORD', 'MASTODON'])
    })
  })

  it('PATCH: marks a manual target COPIED', () => {
    // Re-add REDDIT first so we have a manual target to mark.
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: { platforms: ['DISCORD', 'MASTODON', 'REDDIT'] },
    }).then(() => {
      cy.request<ApiResponse>({
        method: 'PATCH',
        url: `${baseUrl}/${itemId}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: { targetUpdate: { platform: 'REDDIT', status: 'COPIED' } },
      }).then((res) => {
        expect(res.status).to.eq(200)
        const reddit = res.body.data.targets.find((t: any) => t.platform === 'REDDIT')
        expect(reddit.status).to.eq('COPIED')
      })
    })
  })

  it('PUBLISH: dryRun returns variants without sending', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${baseUrl}/${itemId}/publish`,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: { dryRun: true },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.dryRun).to.eq(true)
      expect(res.body.data.variants).to.be.an('array').and.not.be.empty
    })
  })

  it('PUBLISH: rejects without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${baseUrl}/${itemId}/publish`,
      headers: { 'Content-Type': 'application/json' },
      body: { dryRun: true },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: rejects delete without auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: removes post (cascades targets) with valid auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: { Authorization: `Bearer ${userToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.id).to.eq(itemId)
    })
  })

  it('GET: deleted record returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/${itemId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.eq(false)
    })
  })

  after(() => {
    if (!itemId || !userToken) return
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: { Authorization: `Bearer ${userToken}` },
      failOnStatusCode: false,
    })
  })
})
