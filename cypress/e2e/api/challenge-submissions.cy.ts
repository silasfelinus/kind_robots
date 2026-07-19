import {
  adminHeaders,
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

type Contender = {
  id: number
  slug: string
  isActive: boolean
}

type Challenge = {
  id: number
  slug: string
  challengeType: string
}

type ArtImage = {
  id: number
  isPublic: boolean | null
  isActive: boolean | null
}

type ChallengeSubmission = {
  id: number
  createdAt: string
  updatedAt: string | null
  challengeId: number
  botId: number | null
  agentModel: string | null
  outputText: string | null
  artImageId: number | null
  characterId: number | null
  scenarioId: number | null
  status: string
  contenderId: number | null
  variantKey: string
  promptUsed: string | null
  settings: string | null
  randomSelections: string | null
  Challenge?: unknown
  Contender?: unknown
  ArtImage?: unknown
  Character?: unknown
  Scenario?: unknown
  Reactions?: unknown
}

describe('ChallengeSubmission publishing boundary', () => {
  let apiBase = ''
  let adminToken = ''
  let ordinaryUser: TestUserAuth
  let contender: Contender
  let textChallenge: Challenge
  let artChallenge: Challenge
  let privateArtImage: ArtImage
  let submission: ChallengeSubmission | null = null
  const stamp = `${Date.now()}-${Cypress._.random(1000, 9999)}`

  const registerCleanup = (
    label: string,
    url: string,
    headers: Record<string, string>,
  ) =>
    cy.task(
      'cypressCleanup:register',
      {
        label,
        method: 'DELETE',
        url,
        headers,
        expectedStatuses: [200, 404, 409],
      },
      { log: false },
    )

  before(() => {
    getApiEnv().then((env) => {
      apiBase = env.apiBase
      adminToken = env.adminToken
    })

    createLoggedInTestUser({ role: 'second' }).then((auth) => {
      ordinaryUser = auth
    })

    cy.then(() =>
      cy.request<ApiResponse<Contender[]>>({
        method: 'GET',
        url: `${apiBase}/contenders`,
        failOnStatusCode: false,
      }),
    ).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      const active = response.body.data?.find((entry) => entry.isActive)
      expect(active, 'an active seeded Contender').to.exist
      contender = active as Contender
    })

    cy.then(() =>
      cy.request<ApiResponse<Challenge>>({
        method: 'POST',
        url: `${apiBase}/challenges`,
        headers: adminHeaders(adminToken),
        body: {
          slug: `cypress-text-submission-${stamp}`,
          title: `Cypress Text Submission ${stamp}`,
          challengeType: 'TEXT',
          difficulty: 2,
          promptText: 'Write one sentence about a considerate robot.',
          status: 'OPEN',
          isMature: false,
        },
        failOnStatusCode: false,
      }),
    ).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      textChallenge = response.body.data as Challenge
      registerCleanup(
        `Challenge ${textChallenge.id}`,
        `${apiBase}/challenges/${textChallenge.slug}`,
        adminHeaders(adminToken),
      )
    })

    cy.then(() =>
      cy.request<ApiResponse<Challenge>>({
        method: 'POST',
        url: `${apiBase}/challenges`,
        headers: adminHeaders(adminToken),
        body: {
          slug: `cypress-art-submission-${stamp}`,
          title: `Cypress Art Submission ${stamp}`,
          challengeType: 'ART',
          difficulty: 2,
          promptText: 'Publish one safe public robot image.',
          status: 'OPEN',
          isMature: false,
        },
        failOnStatusCode: false,
      }),
    ).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      artChallenge = response.body.data as Challenge
      registerCleanup(
        `Challenge ${artChallenge.id}`,
        `${apiBase}/challenges/${artChallenge.slug}`,
        adminHeaders(adminToken),
      )
    })

    cy.then(() =>
      cy.request<ApiResponse<ArtImage>>({
        method: 'POST',
        url: `${apiBase}/art/image`,
        headers: bearerHeaders(ordinaryUser.token),
        body: {
          imagePath: `/images/cypress-private-submission-${stamp}.png`,
          fileName: `cypress-private-submission-${stamp}.png`,
          fileType: 'png',
          isPublic: false,
          isActive: true,
          isMature: false,
        },
        failOnStatusCode: false,
      }),
    ).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      privateArtImage = response.body.data as ArtImage
      registerCleanup(
        `ArtImage ${privateArtImage.id}`,
        `${apiBase}/art/image/${privateArtImage.id}`,
        bearerHeaders(ordinaryUser.token),
      )
    })
  })

  after(() => {
    if (submission?.id) {
      cy.request({
        method: 'DELETE',
        url: `${apiBase}/challenges/submissions/${submission.id}`,
        headers: adminHeaders(adminToken),
        failOnStatusCode: false,
      })
    }

    if (textChallenge?.slug) {
      cy.request({
        method: 'DELETE',
        url: `${apiBase}/challenges/${textChallenge.slug}`,
        headers: adminHeaders(adminToken),
        failOnStatusCode: false,
      })
    }

    if (artChallenge?.slug) {
      cy.request({
        method: 'DELETE',
        url: `${apiBase}/challenges/${artChallenge.slug}`,
        headers: adminHeaders(adminToken),
        failOnStatusCode: false,
      })
    }

    if (privateArtImage?.id) {
      cy.request({
        method: 'DELETE',
        url: `${apiBase}/art/image/${privateArtImage.id}`,
        headers: bearerHeaders(ordinaryUser.token),
        failOnStatusCode: false,
      })
    }
  })

  it('denies anonymous submission publishing', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/challenges/${textChallenge.slug}/submissions`,
      body: {
        contenderSlug: contender.slug,
        outputText: 'A robot held the door without demanding applause.',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
      expect(response.body.statusCode).to.eq(401)
    })
  })

  it('denies non-admin submission publishing', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/challenges/${textChallenge.slug}/submissions`,
      headers: bearerHeaders(ordinaryUser.token),
      body: {
        contenderSlug: contender.slug,
        outputText: 'A robot held the door without demanding applause.',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
      expect(response.body.statusCode).to.eq(403)
    })
  })

  it('rejects server-owned and unknown fields', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/challenges/${textChallenge.slug}/submissions`,
      headers: adminHeaders(adminToken),
      body: {
        contenderSlug: contender.slug,
        outputText: 'A robot held the door without demanding applause.',
        challengeId: artChallenge.id,
        status: 'READY',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(
        /unsupported challengesubmission fields/i,
      )
      expect(response.body.message || '').to.match(/challengeId/i)
      expect(response.body.message || '').to.match(/status/i)
    })
  })

  it('requires the output field owned by the Challenge type', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/challenges/${artChallenge.slug}/submissions`,
      headers: adminHeaders(adminToken),
      body: {
        contenderSlug: contender.slug,
        outputText: 'This is text, not an ArtImage.',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/art challenges require artImageId/i)
    })
  })

  it('denies publishing another user’s private ArtImage', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/challenges/${artChallenge.slug}/submissions`,
      headers: adminHeaders(adminToken),
      body: {
        contenderSlug: contender.slug,
        artImageId: privateArtImage.id,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
      expect(response.body.message || '').to.match(/public, active resource/i)
    })
  })

  it('lets an admin publish one lean, type-compatible submission', () => {
    cy.request<ApiResponse<ChallengeSubmission>>({
      method: 'POST',
      url: `${apiBase}/challenges/${textChallenge.slug}/submissions`,
      headers: adminHeaders(adminToken),
      body: {
        contenderSlug: contender.slug,
        variantKey: `cypress-${stamp}`,
        promptUsed: 'Write one sentence about a considerate robot.',
        settings: { temperature: 0.2 },
        randomSelections: { virtue: 'consideration' },
        agentModel: 'cypress-model',
        outputText: 'A robot held the door without demanding applause.',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.statusCode).to.eq(201)
      expect(response.body.data?.challengeId).to.eq(textChallenge.id)
      expect(response.body.data?.contenderId).to.eq(contender.id)
      expect(response.body.data?.status).to.eq('READY')
      expect(response.body.data?.outputText).to.contain('held the door')
      expect(response.body.data).not.to.have.property('Challenge')
      expect(response.body.data).not.to.have.property('Contender')
      expect(response.body.data).not.to.have.property('ArtImage')
      expect(response.body.data).not.to.have.property('Character')
      expect(response.body.data).not.to.have.property('Scenario')
      expect(response.body.data).not.to.have.property('Reactions')
      submission = response.body.data as ChallengeSubmission

      registerCleanup(
        `ChallengeSubmission ${submission.id}`,
        `${apiBase}/challenges/submissions/${submission.id}`,
        adminHeaders(adminToken),
      )
    })
  })

  it('returns 409 for a duplicate contender variant', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${apiBase}/challenges/${textChallenge.slug}/submissions`,
      headers: adminHeaders(adminToken),
      body: {
        contenderSlug: contender.slug,
        variantKey: `cypress-${stamp}`,
        outputText: 'A duplicate should not become a second row.',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.eq(false)
      expect(response.body.statusCode).to.eq(409)
    })
  })

  it('denies anonymous deletion', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${apiBase}/challenges/submissions/${submission?.id}`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('denies non-admin deletion', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${apiBase}/challenges/submissions/${submission?.id}`,
      headers: bearerHeaders(ordinaryUser.token),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('lets an admin delete the submission without manual relation cleanup', () => {
    cy.request<ApiResponse<ChallengeSubmission>>({
      method: 'DELETE',
      url: `${apiBase}/challenges/submissions/${submission?.id}`,
      headers: adminHeaders(adminToken),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.id).to.eq(submission?.id)
      expect(response.body.data).not.to.have.property('Challenge')
      expect(response.body.data).not.to.have.property('Contender')
      expect(response.body.data).not.to.have.property('Reactions')
      submission = null
    })
  })
})
