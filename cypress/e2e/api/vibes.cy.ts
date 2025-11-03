// /cypress/e2e/api/vibes.cy.ts
/// <reference types="cypress" />

// Path: cypress/e2e/api/vibes.cy.ts

describe('Vibes CRUD and user membership', () => {
  // Allow overriding in CI: CYPRESS_API_BASE, CYPRESS_AUTH_BASE
  const API_BASE = Cypress.env('API_BASE') ?? ''
  const base = `${API_BASE}/api`
  const now = Date.now()
  const vibeTitle = `awesome sauce ${now}`

  // Will be set in before()
  let createdId: number | undefined
  let testUserId: number | undefined
  let userApiKey: string | undefined

  // Simple login helper if you need it later
  const login = (username: string, password = 'testtest12') =>
    cy.request({
      method: 'POST',
      url: `${API_BASE}/api/auth/login`,
      headers: { 'Content-Type': 'application/json' },
      body: { username, password },
      failOnStatusCode: false,
    })

  before(() => {
    const uniqueUsername = `vibeuser${now}`
    const email = `${uniqueUsername}@kindrobots.org`

    // If your registration requires a server key, provide it via CYPRESS_API_KEY
    const serverApiKey = Cypress.env('API_KEY')

    // 1) Register a user we control for this suite
    cy.request({
      method: 'POST',
      url: `${base}/users/register`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(serverApiKey ? { 'x-api-key': serverApiKey } : {}),
      },
      body: {
        username: uniqueUsername,
        email,
        password: 'testtest12',
      },
      failOnStatusCode: false,
    }).then((res) => {
      // Accept 200/201 success or 409 already exists (re-runs)
      expect(
        res.status,
        `register: ${res.status} ${JSON.stringify(res.body)}`,
      ).to.be.oneOf([200, 201, 409])

      if (res.status === 409) {
        // If user already exists, login to fetch details if needed
        return login(uniqueUsername).then((lr) => {
          expect(lr.status).to.eq(200)
          // If your login returns user info, pull it; otherwise fetch /users/me if you have one
          const u = lr.body?.data?.user || lr.body?.user
          if (u?.id && u?.apiKey) {
            testUserId = u.id
            userApiKey = u.apiKey
          }
        })
      }

      // Fresh registration path
      expect(res.body?.success, 'register success').to.eq(true)
      const u = res.body.user
      expect(u?.id, 'registered user id').to.be.a('number')
      expect(u?.apiKey, 'registered user apiKey').to.be.a('string')

      testUserId = u.id
      userApiKey = u.apiKey
    })
  })

  it('lists existing vibes', () => {
    cy.request('GET', `${base}/pitches?type=VIBE`)
      .its('status')
      .should('eq', 200)
  })

  it('creates a vibe as Pitch(VIBE)', () => {
    expect(testUserId, 'testUserId').to.be.a('number')
    expect(userApiKey, 'userApiKey').to.be.a('string')

    cy.request({
      method: 'POST',
      url: `${base}/pitches`,
      headers: {
        'Content-Type': 'application/json',
        // Your API validates Bearer against user.apiKey
        Authorization: `Bearer ${userApiKey}`,
      },
      body: {
        title: vibeTitle,
        pitch: vibeTitle, // required string per schema
        description: 'A fun vibe for testing',
        isPublic: true,
        PitchType: 'VIBE',
        userId: testUserId, // make sure auth user matches the resource owner
        designer: 'cypress-bot',
      },
    }).then((res) => {
      expect(
        res.status,
        `create status: ${res.status} ${JSON.stringify(res.body)}`,
      ).to.be.oneOf([200, 201])

      // Accept either top-level { id } or { data: { id } } depending on your handler
      const id: unknown = res.body?.id ?? res.body?.data?.id
      if (typeof id !== 'number') {
        throw new Error(
          `Could not find created id in response: ${JSON.stringify(res.body)}`,
        )
      }
      createdId = id
    })
  })

  it('updates the vibe description', () => {
    expect(createdId, 'createdId').to.be.a('number')
    expect(userApiKey, 'userApiKey').to.be.a('string')

    cy.request({
      method: 'PATCH',
      url: `${base}/pitches/${createdId}`,
      headers: { Authorization: `Bearer ${userApiKey}` },
      body: { description: 'An even better test vibe' },
    })
      .its('status')
      .should('eq', 200)
  })
  it('attaches the vibe to user.vibes', () => {
    expect(testUserId, 'testUserId').to.be.a('number')
    expect(userApiKey, 'userApiKey').to.be.a('string')

    // Build the slug the same way you do elsewhere
    const slug = vibeTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64)

    // 1) Read the current user to get existing `vibes` string
    cy.request({
      method: 'GET',
      url: `${base}/users/${testUserId}`,
      headers: { Authorization: `Bearer ${userApiKey}` },
    })
      .then((getRes) => {
        expect(getRes.status).to.be.oneOf([200])
        const user = getRes.body?.data ?? getRes.body?.user ?? getRes.body

        // Parse existing vibes (stored as string)
        let current: any[] = []
        if (typeof user?.vibes === 'string' && user.vibes.trim().length) {
          try {
            const parsed = JSON.parse(user.vibes)
            if (Array.isArray(parsed)) current = parsed
          } catch {
            // If it wasn't valid JSON, ignore and start fresh
          }
        }

        // 2) Append our vibe entry
        const next = [...current, { title: vibeTitle, slug }]

        // 3) PATCH vibes as a STRING (JSON)
        return cy.request({
          method: 'PATCH',
          url: `${base}/users/${testUserId}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userApiKey}`,
          },
          body: {
            vibes: JSON.stringify(next),
          },
          failOnStatusCode: false,
        })
      })
      .then((patchRes) => {
        expect(
          patchRes?.status,
          `patch status: ${patchRes?.status} ${JSON.stringify(patchRes?.body)}`,
        ).to.be.oneOf([200])
      })
  })

  it('deletes the created vibe', () => {
    expect(createdId, 'createdId').to.be.a('number')
    expect(userApiKey, 'userApiKey').to.be.a('string')

    cy.request({
      method: 'DELETE',
      url: `${base}/pitches/${createdId}`,
      headers: { Authorization: `Bearer ${userApiKey}` },
    })
      .its('status')
      .should('eq', 200)
  })
})
