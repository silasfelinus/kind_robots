import assert from 'node:assert/strict'
import type {
  ColoringBookProductionState,
  ColoringBookProposal,
  ColoringBookStudioBook,
} from '~/types/coloringBookStudio'
import {
  proposalReadiness,
  summarizeBookReadiness,
} from '@/utils/coloringBookReadiness'

function proposal(
  id: string,
  overrides: Partial<ColoringBookProposal> = {},
): ColoringBookProposal {
  return {
    slot: Number(id.match(/\d+/)?.[0] || 1),
    id,
    title: id,
    prompt: 'A complete production prompt.',
    promptRef: null,
    promptSourcePath: 'projects/coloring-book/sets/kind-robots/proposals.yaml',
    inspirations: [],
    accepted: { color: null, bw: null },
    final: { color: null, bw: null },
    notes: [],
    queue: {
      status: 'pending',
      imagePath: null,
      renderedPath: null,
      artImageId: null,
      semanticScore: null,
      semanticVerdict: null,
      semanticAttempts: 0,
      semanticGateError: null,
      completedAt: null,
      renderEngine: null,
      revisionCount: 0,
    },
    colorPath: null,
    colorUrl: null,
    bwPath: null,
    bwUrl: null,
    ...overrides,
  }
}

function production(
  proposalId: string,
  overrides: Partial<ColoringBookProductionState> = {},
): ColoringBookProductionState {
  return {
    bookSlug: 'kind-robots',
    proposalId,
    colorStatus: 'pending',
    colorRenderedPath: null,
    colorArtImageId: null,
    colorApprovedAt: null,
    seedLocked: false,
    bwStatus: 'missing',
    bwRenderedPath: null,
    bwUrl: null,
    bwArtImageId: null,
    bwSemanticScore: null,
    bwSemanticVerdict: null,
    bwSemanticReasons: [],
    bwRejectedPath: null,
    bwCompletedAt: null,
    bwRevisionCount: 0,
    pairStatus: null,
    pairSemanticScore: null,
    pairSemanticReasons: [],
    pairFinalizedAt: null,
    history: [],
    ...overrides,
  }
}

const legacyColor = proposal('kr-001', {
  colorPath: 'approved/kr-001-color.webp',
  colorUrl: 'https://example.test/kr-001-color.webp',
})
assert.equal(
  proposalReadiness('kind-robots', legacyColor, null).key,
  'accept-color',
)

const externalReference = proposal('kr-002', {
  colorPath: 'projects/process/kr-002.webp',
  colorUrl: 'https://example.test/kr-002.webp',
})
assert.equal(
  proposalReadiness('kind-robots', externalReference, null).key,
  'needs-color',
)

const acceptedColor = proposal('kr-003', {
  accepted: { color: 'approved/kr-003-color.webp', bw: null },
})
assert.equal(
  proposalReadiness('kind-robots', acceptedColor, null).key,
  'needs-bw',
)

const bwCandidate = proposal('kr-004', {
  accepted: { color: 'approved/kr-004-color.webp', bw: null },
})
assert.equal(
  proposalReadiness(
    'kind-robots',
    bwCandidate,
    production('kr-004', {
      bwStatus: 'done',
      bwRenderedPath: 'generated/bw/kr-004-bw.webp',
    }),
  ).key,
  'accept-bw',
)

const acceptedPair = proposal('kr-005', {
  accepted: {
    color: 'approved/kr-005-color.webp',
    bw: 'approved/kr-005-bw.webp',
  },
})
assert.equal(
  proposalReadiness('kind-robots', acceptedPair, production('kr-005')).key,
  'finalize',
)

const finalPair = proposal('kr-006', {
  accepted: {
    color: 'approved/kr-006-color.webp',
    bw: 'approved/kr-006-bw.webp',
  },
  final: {
    color: 'approved/kr-006-color.webp',
    bw: 'approved/kr-006-bw.webp',
  },
})
assert.equal(
  proposalReadiness('kind-robots', finalPair, production('kr-006')).key,
  'final',
)

const blocked = proposal('kr-007', {
  queue: {
    ...proposal('kr-007').queue,
    semanticGateError: 'Reviewer unavailable',
  },
})
assert.equal(
  proposalReadiness('kind-robots', blocked, null).key,
  'blocked',
)

const book: ColoringBookStudioBook = {
  order: 3,
  slug: 'kind-robots',
  title: 'Kind Robots',
  status: 'in-production',
  targetProposals: 7,
  coverIsSeparate: true,
  counts: {
    total: 7,
    prompts: 7,
    pending: 0,
    rendered: 0,
    acceptedColor: 3,
    acceptedPairs: 2,
    finalPairs: 1,
    needsReview: 1,
    blocked: 1,
  },
  proposals: [
    legacyColor,
    externalReference,
    acceptedColor,
    bwCandidate,
    acceptedPair,
    finalPair,
    blocked,
  ],
}
const states = {
  'kind-robots:kr-004': production('kr-004', {
    bwStatus: 'done',
    bwRenderedPath: 'generated/bw/kr-004-bw.webp',
  }),
  'kind-robots:kr-005': production('kr-005'),
  'kind-robots:kr-006': production('kr-006'),
}
const summary = summarizeBookReadiness(book, states)
assert.equal(summary.final, 1)
assert.equal(summary.finalize, 1)
assert.equal(summary.acceptColor, 1)
assert.equal(summary.acceptBw, 1)
assert.equal(summary.needsColor, 1)
assert.equal(summary.needsBw, 1)
assert.equal(summary.blocked, 1)
assert.equal(summary.actionable, 6)
assert.equal(summary.interiorReady, false)
assert.equal(summary.coverPending, true)
assert.equal(summary.printReady, false)

console.log('Coloring Book readiness contract passed.')
