// cypress/e2e/dominion.cy.ts
/* Path: cypress/e2e/dominion.cy.ts */
/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Dominion Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/dominions'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'not-a-real-token'
  let dominionId: number | undefined

  // Generate unique title/slug per run (Silas prefers Date.now)
  const uniqueStamp = Date.now()
  const uniqueTitle = `Way of the Otter ${uniqueStamp}`
  const uniqueSlug = `way-of-the-otter-${uniqueStamp}`

  // --- Helpers
  const createHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  // --- 0. Public GETs should work without auth
  it('Get All Dominions (public) - no auth required', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: createHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('array')
    })
  })

  // --- 1. Create: auth failure cases
  it('should not allow creating a Dominion without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: createHeaders(), // no auth
      failOnStatusCode: false,
      body: {
        title: uniqueTitle,
        slug: uniqueSlug,
        description:
          'Gain +1 Action and +1 Buy. You may discard a card for +$1.',
        italics: 'Otters organize. You just paddle.',
        color: 'blue',
        designer: 'Kind Designer',
        isPublic: true,
        isMature: false,
        types: ['Action'],
        keywords: ['Gain', 'Discard'],
        cardAdd: 0,
        actionAdd: 1,
        buyAdd: 1,
        coinAdd: 1,
        victoryAdd: 0,
        isDuration: false,
        priceCoins: 4,
        priceDebt: 0,
        pricePotion: 0,
        effects: { onPlay: [{ type: 'discardForCoins', amount: 1 }] },
        setupText: null,
        notes: 'First pass test card',
        setId: 'fanpack-alpha',
      },
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.message || res.body.error).to.exist
    })
  })

  it('should not allow creating a Dominion with an invalid token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: createHeaders(invalidToken),
      failOnStatusCode: false,
      body: {
        title: uniqueTitle,
        slug: uniqueSlug,
        description:
          'Gain +1 Action and +1 Buy. You may discard a card for +$1.',
        italics: 'Otters organize. You just paddle.',
        color: 'blue',
        designer: 'Kind Designer',
        isPublic: true,
        isMature: false,
        types: ['Action'],
        keywords: ['Gain', 'Discard'],
        cardAdd: 0,
        actionAdd: 1,
        buyAdd: 1,
        coinAdd: 1,
        victoryAdd: 0,
        isDuration: false,
        priceCoins: 4,
        priceDebt: 0,
        pricePotion: 0,
        effects: { onPlay: [{ type: 'discardForCoins', amount: 1 }] },
        setupText: null,
        notes: 'First pass test card',
        setId: 'fanpack-alpha',
      },
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.message || res.body.error).to.exist
    })
  })

  // --- 2. Create with valid auth
  it('Create a New Dominion with Valid Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: createHeaders(userToken),
      body: {
        title: uniqueTitle,
        slug: uniqueSlug,
        description:
          'Gain +1 Action and +1 Buy. You may discard a card for +$1.',
        italics: 'Otters organize. You just paddle.',
        color: 'blue',
        designer: 'Kind Designer',
        isPublic: true,
        isMature: false,
        types: ['Action'],
        keywords: ['Gain', 'Discard'],
        cardAdd: 0,
        actionAdd: 1,
        buyAdd: 1,
        coinAdd: 1,
        victoryAdd: 0,
        isDuration: false,
        priceCoins: 4,
        priceDebt: 0,
        pricePotion: 0,
        effects: { onPlay: [{ type: 'discardForCoins', amount: 1 }] },
        setupText: null,
        notes: 'First pass test card',
        setId: 'fanpack-alpha',
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('object')
      expect(res.body.data.title).to.eq(uniqueTitle)
      expect(res.body.data.slug).to.eq(uniqueSlug)
      dominionId = res.body.data.id
      expect(dominionId).to.be.a('number')
    })
  })

  // --- 3. Get by ID (auth optional, but include token in case)
  it('Retrieve Dominion by ID', () => {
    cy.wrap(dominionId).should('exist')
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${dominionId}`,
      headers: createHeaders(userToken),
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('object')
      expect(res.body.data.title).to.eq(uniqueTitle)
    })
  })

  // --- 4. Update: auth failure cases
  it('Attempt to Update Dominion without Authentication (expect failure)', () => {
    cy.wrap(dominionId).should('exist')
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${dominionId}`,
      headers: createHeaders(), // no auth
      failOnStatusCode: false,
      body: {
        description: 'Unauthorized update attempt',
      },
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('Attempt to Update Dominion with Invalid Token (expect failure)', () => {
    cy.wrap(dominionId).should('exist')
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${dominionId}`,
      headers: createHeaders(invalidToken),
      failOnStatusCode: false,
      body: {
        description: 'Invalid token update attempt',
      },
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  // --- 5. Update with valid auth
  it('Update Dominion with Authentication', () => {
    cy.wrap(dominionId).should('exist')
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${dominionId}`,
      headers: createHeaders(userToken),
      body: {
        description: 'Updated description',
        keywords: ['Gain', 'Discard', 'Organize'],
        priceCoins: 5,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.description).to.eq('Updated description')
      expect(res.body.data.priceCoins).to.eq(5)
      expect(res.body.data.keywords).to.include('Organize')
    })
  })

  // --- 6. Disconnect art (nullable patch)
  it('Disconnect art on a Dominion', () => {
    cy.wrap(dominionId).should('exist')
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${dominionId}`,
      headers: createHeaders(userToken),
      body: {
        artId: null,
        artImageId: null,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      // Backend may omit null fields; if present, they should be null
      if ('artId' in res.body.data) expect(res.body.data.artId).to.be.null
      if ('artImageId' in res.body.data)
        expect(res.body.data.artImageId).to.be.null
    })
  })

  // --- 7. List all dominions (authed)
  it('Retrieve All Dominions (authed)', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: createHeaders(userToken),
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('array')
    })
  })

  // --- 8. Delete: auth failure cases
  it('Attempt to Delete Dominion without Authentication (expect failure)', () => {
    cy.wrap(dominionId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${dominionId}`,
      headers: createHeaders(), // no auth
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('Attempt to Delete Dominion with Invalid Token (expect failure)', () => {
    cy.wrap(dominionId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${dominionId}`,
      headers: createHeaders(invalidToken),
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  // --- 9. Delete with valid auth (cleanup)
  it('Delete Dominion with Authentication', () => {
    cy.wrap(dominionId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${dominionId}`,
      headers: createHeaders(userToken),
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      // message text may vary across routes; accept either variant
      const msg = `${res.body.message || ''}`.toLowerCase()
      expect(msg).to.include(`${dominionId}`) // should mention ID
    })
  })
})
