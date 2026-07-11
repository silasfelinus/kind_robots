// /cypress/e2e/api/legacy-genre-dream-readonly.cy.ts
import { createLoggedInTestUser } from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type DreamSummary = {
  id: number
  dreamType: string
}

describe('Legacy Genre Dream write guards', () => {
  const apiBase = 'https://kind-robots.vercel.app/api'
  const stamp = Date.now()
  let token = ''
  let dreamId = 0
  let legacyGenreDreamId = 0

  before(() => {
    createLoggedInTestUser().then((auth) => {
      token = auth.token
    })
  })

  it('rejects Genre creation through the single Dream endpoint', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/dreams`,
      failOnStatusCode: false,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: `Wrong Genre Route ${stamp}`,
        slug: `wrong-genre-route-${stamp}`,
        dreamType: 'GENRE',
        description: 'Reusable taxonomy belongs in Facets.',
      },
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.contain('/api/facets')
    })
  })

  it('rejects Genre creation through the Dream batch endpoint', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/dreams/batch`,
      failOnStatusCode: false,
      headers: { Authorization: `Bearer ${token}` },
      body: [
        {
          title: `Wrong Batch Genre Route ${stamp}`,
          slug: `wrong-batch-genre-route-${stamp}`,
          dreamType: 'GENRE',
          description: 'Batch taxonomy imports must use Facets too.',
        },
      ],
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.be.false
      expect(response.body.count).to.eq(0)
      expect(response.body.errors).to.have.length(1)
      expect(response.body.errors[0].statusCode).to.eq(409)
      expect(response.body.errors[0].message).to.contain('/api/facets')
    })
  })

  it('creates an ordinary Dream for conversion coverage', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/dreams`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: `Genre Guard Dream ${stamp}`,
        slug: `genre-guard-dream-${stamp}`,
        dreamType: 'PITCH',
        description: 'An ordinary Dream must not become taxonomy through PATCH.',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      dreamId = response.body.data.id
    })
  })

  it('rejects changing an ordinary Dream into a Genre', () => {
    cy.request({
      method: 'PATCH',
      url: `${apiBase}/dreams/${dreamId}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
      body: { dreamType: 'GENRE' },
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.contain('/api/facets')
    })
  })

  it('finds a readable legacy Genre Dream compatibility row', () => {
    cy.request(`${apiBase}/dreams?dreamType=GENRE&limit=1`).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('array').and.not.be.empty

      const genreDream = (response.body.data as DreamSummary[]).find(
        (dream) => dream.dreamType === 'GENRE',
      )
      expect(genreDream).to.exist
      legacyGenreDreamId = genreDream?.id ?? 0
    })
  })

  it('protects legacy Genre Dreams from PATCH and DELETE', () => {
    expect(legacyGenreDreamId).to.be.greaterThan(0)

    for (const method of ['PATCH', 'DELETE'] as const) {
      cy.request({
        method,
        url: `${apiBase}/dreams/${legacyGenreDreamId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
        ...(method === 'PATCH' ? { body: { title: 'Must remain unchanged' } } : {}),
      }).then((response) => {
        expect(response.status).to.eq(409)
        expect(response.body.success).to.be.false
        expect(response.body.message).to.contain('/api/facets')
      })
    }
  })

  it('rejects new chats through a legacy Genre Dream ID', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/chats`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
      body: {
        type: 'Dream',
        sender: 'Cypress Genre Guard',
        content: 'This must not extend legacy Genre Dream history.',
        dreamId: legacyGenreDreamId,
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.contain('Facet')
    })
  })

  it('keeps Project and Genre out of Dream builder choices', () => {
    cy.readFile('stores/helpers/dreamHelper.ts').then((source: string) => {
      expect(source).to.include('CREATABLE_DREAM_TYPES')
      expect(source).to.include("type !== 'PROJECT' && type !== 'GENRE'")
    })

    cy.readFile('stores/helpers/dreamCards.ts').then((source: string) => {
      expect(source).to.include('CREATABLE_DREAM_TYPES.map')
      expect(source).not.to.include("value: 'PROJECT'")
      expect(source).not.to.include("value: 'GENRE'")
    })
  })

  after(() => {
    if (!dreamId) return

    cy.request({
      method: 'DELETE',
      url: `${apiBase}/dreams/${dreamId}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    })
  })
})
