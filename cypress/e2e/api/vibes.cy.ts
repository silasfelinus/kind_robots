// /cypress/e2e/api/vibes.cy.ts
/// <reference types="cypress" />

// Path: cypress/e2e/api/vibes.cy.ts

describe('Vibes CRUD and user membership', () => {
  const base = '/api'
  const now = Date.now()
  const vibeTitle = `awesome sauce ${now}`
  let createdId: number | undefined
  const testUserId = 1

  it('lists existing vibes', () => {
    cy.request('GET', `${base}/pitches?type=VIBE`)
      .its('status')
      .should('eq', 200)
  })

  it('creates a vibe as Pitch(VIBE)', () => {
    cy.request('POST', `${base}/pitches`, {
      title: vibeTitle,
      pitch: vibeTitle,
      description: 'A fun vibe for testing',
      isPublic: true,
      PitchType: 'VIBE',
      userId: testUserId,
      designer: 'cypress-bot',
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('id')
      createdId = res.body.id
    })
  })

  it('updates the vibe description', function () {
    expect(createdId, 'createdId').to.be.a('number')
    cy.request('PATCH', `${base}/pitches/${createdId}`, {
      description: 'An even better test vibe',
    })
      .its('status')
      .should('eq', 200)
  })

  it('attaches the vibe to user.vibes', () => {
    // Compute slug same way as store
    const slug = vibeTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64)

    cy.request('PATCH', `${base}/users/${testUserId}`, {
      vibes: [{ title: vibeTitle, slug }],
    })
      .its('status')
      .should('eq', 200)
  })

  it('deletes the created vibe', function () {
    expect(createdId, 'createdId').to.be.a('number')
    cy.request('DELETE', `${base}/pitches/${createdId}`)
      .its('status')
      .should('eq', 200)
  })
})
