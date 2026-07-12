// /cypress/e2e/api/facet-assignments.cy.ts
import { createLoggedInTestUser } from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Dream and Scenario Facet assignments', () => {
  const apiBase = 'https://kind-robots.vercel.app/api'
  const stamp = Date.now()
  const facetSlug = `cowcore-${stamp}`
  const cowAlias = `cow-${stamp}`
  const cowsAlias = `cows-${stamp}`
  let token = ''
  let facetId = 0
  let dreamId = 0
  let scenarioId = 0
  let artImageId = 0

  before(() => {
    createLoggedInTestUser().then((auth) => {
      token = auth.token
    })
  })

  it('creates one canonical Facet with singular and plural aliases', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/facets`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: `CowCore ${stamp}`,
        slug: facetSlug,
        kind: 'CORE',
        aliases: [cowAlias, cowsAlias],
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data.aliases).to.include(facetSlug)
      expect(response.body.data.aliases).to.include(cowAlias)
      expect(response.body.data.aliases).to.include(cowsAlias)
      facetId = response.body.data.id
    })
  })

  it('resolves canonical formatting variants and explicit aliases to one Facet', () => {
    const keys = [
      facetSlug,
      `cowCore ${stamp}`,
      `cow-core-${stamp}`,
      cowAlias,
      cowsAlias,
    ]

    keys.forEach((key) => {
      // The Facet is created isPublic: false, so lookups must authenticate
      // as its owner or the visibility check answers 404.
      cy.request({
        url: `${apiBase}/facets/${encodeURIComponent(key)}`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.success).to.be.true
        expect(response.body.data.id).to.eq(facetId)
      })
    })
  })

  it('assigns the Facet to a Dream through an alias key', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/dreams`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: `Facet Dream ${stamp}`,
        dreamType: 'PITCH',
        description: 'Dream Facet assignment coverage.',
        isPublic: false,
        createCollection: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      dreamId = response.body.data.id
    })

    // dreamId is only set inside the .then above, so every dependent URL must
    // be built lazily (inside its own .then) rather than at enqueue time.
    cy.then(() =>
      cy.request({
        method: 'PUT',
        url: `${apiBase}/dreams/${dreamId}/facets`,
        headers: { Authorization: `Bearer ${token}` },
        body: { facetKeys: [cowAlias] },
      }),
    ).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data).to.have.length(1)
      expect(response.body.data[0].id).to.eq(facetId)
    })

    cy.then(() =>
      cy.request({
        url: `${apiBase}/dreams/${dreamId}/facets`,
        headers: { Authorization: `Bearer ${token}` },
      }),
    ).then((response) => {
      expect(response.status).to.eq(200)
      expect(
        response.body.data.map((facet: { id: number }) => facet.id),
      ).to.deep.eq([facetId])
    })
  })

  it('assigns the same Facet to a Scenario through the plural alias', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/scenarios`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: `Facet Scenario ${stamp}`,
        description: 'Scenario Facet assignment coverage.',
        intros: [],
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      scenarioId = response.body.data.id
    })

    // Same lazy-URL rule as the Dream test: scenarioId is assigned in the
    // .then above, after this test body has already enqueued its commands.
    cy.then(() =>
      cy.request({
        method: 'PUT',
        url: `${apiBase}/scenarios/${scenarioId}/facets`,
        headers: { Authorization: `Bearer ${token}` },
        body: { facetKeys: [cowsAlias] },
      }),
    ).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data).to.have.length(1)
      expect(response.body.data[0].id).to.eq(facetId)
    })

    cy.then(() =>
      cy.request({
        url: `${apiBase}/scenarios/${scenarioId}/facets`,
        headers: { Authorization: `Bearer ${token}` },
      }),
    ).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data[0].id).to.eq(facetId)
    })

    cy.then(() =>
      cy.request({
        url: `${apiBase}/scenarios/${scenarioId}`,
        headers: { Authorization: `Bearer ${token}` },
      }),
    ).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data.Facets).to.have.length(1)
      expect(response.body.data.Facets[0].id).to.eq(facetId)
      expect(response.body.data.Facets[0].aliases).to.include(cowsAlias)
      expect(response.body.data._count.Facets).to.eq(1)
    })

    cy.request({
      url: `${apiBase}/scenarios`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      const scenario = response.body.data.find(
        (entry: { id: number }) => entry.id === scenarioId,
      )
      expect(scenario).to.exist
      expect(
        scenario.Facets.map((facet: { id: number }) => facet.id),
      ).to.deep.eq([facetId])
    })
  })

  it('uses exact-set semantics when a Facet is removed', () => {
    cy.request({
      method: 'PUT',
      url: `${apiBase}/dreams/${dreamId}/facets`,
      headers: { Authorization: `Bearer ${token}` },
      body: { facetIds: [] },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data).to.deep.eq([])
    })

    cy.request({
      url: `${apiBase}/dreams/${dreamId}/facets`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      expect(response.body.data).to.deep.eq([])
    })
  })

  it('assigns the Facet to an ArtImage and reads it back', () => {
    cy.request({
      method: 'POST',
      url: `${apiBase}/art/image`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        promptString: `facet assignment fixture ${stamp}`,
        path: ' ',
        imagePath: 'justfortesting',
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      artImageId = response.body.data.id

      cy.request({
        method: 'PUT',
        url: `${apiBase}/art/image/${artImageId}/facets`,
        headers: { Authorization: `Bearer ${token}` },
        body: { facetIds: [facetId] },
      }).then((putResponse) => {
        expect(putResponse.status).to.eq(200)
        expect(putResponse.body.success).to.be.true
        expect(putResponse.body.data).to.have.length(1)
        expect(putResponse.body.data[0].id).to.eq(facetId)
      })

      cy.request({
        url: `${apiBase}/art/image/${artImageId}/facets`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((getResponse) => {
        expect(getResponse.status).to.eq(200)
        expect(getResponse.body.data).to.have.length(1)
        expect(getResponse.body.data[0].id).to.eq(facetId)
      })

      // Exact-set semantics: an empty set clears the link.
      cy.request({
        method: 'PUT',
        url: `${apiBase}/art/image/${artImageId}/facets`,
        headers: { Authorization: `Bearer ${token}` },
        body: { facetIds: [] },
      }).then((clearResponse) => {
        expect(clearResponse.status).to.eq(200)
        expect(clearResponse.body.data).to.deep.eq([])
      })
    })
  })

  it('updates the Facet in place and keeps alias resolution consistent', () => {
    const bovineAlias = `bovine-${stamp}`

    cy.request({
      method: 'PATCH',
      url: `${apiBase}/facets/${facetId}`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        description: 'Everything cows, updated.',
        kind: 'THEME',
        aliases: [cowAlias, bovineAlias],
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.kind).to.eq('THEME')
      expect(response.body.data.description).to.eq('Everything cows, updated.')
      expect(response.body.data.aliases).to.include(facetSlug)
      expect(response.body.data.aliases).to.include(cowAlias)
      expect(response.body.data.aliases).to.include(bovineAlias)
      // cowsAlias was omitted from the exact set, so it no longer resolves.
      expect(response.body.data.aliases).to.not.include(cowsAlias)
    })

    cy.request({
      url: `${apiBase}/facets/${encodeURIComponent(bovineAlias)}`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data.id).to.eq(facetId)
    })

    cy.request({
      url: `${apiBase}/facets/${encodeURIComponent(cowsAlias)}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(404)
    })
  })

  after(() => {
    if (dreamId) {
      cy.request({
        method: 'DELETE',
        url: `${apiBase}/dreams/${dreamId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      })
    }

    if (scenarioId) {
      cy.request({
        method: 'DELETE',
        url: `${apiBase}/scenarios/${scenarioId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      })
    }

    if (artImageId) {
      cy.request({
        method: 'DELETE',
        url: `${apiBase}/art/image/${artImageId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      })
    }

    if (facetId) {
      cy.request({
        method: 'DELETE',
        url: `${apiBase}/facets/${facetId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      })
    }
  })
})
