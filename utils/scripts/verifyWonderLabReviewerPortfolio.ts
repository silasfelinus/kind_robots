import assert from 'node:assert/strict'
import {
  assignWonderLabReviewerPortfolio,
  isWonderLabActiveEditorialDraft,
  isWonderLabEditoriallyExcludedReviewer,
  type WonderLabPortfolioCandidate,
} from '@/utils/wonderlab/reviewerPortfolio'

function candidate(
  id: number,
  kind: 'BOT' | 'CHARACTER',
  name: string,
  score: number,
  coverage: 'MISSING' | 'DRAFTED' | 'PUBLISHED' = 'MISSING',
): WonderLabPortfolioCandidate {
  return {
    reviewer: {
      id,
      kind,
      name,
      voice: `${name} voice`,
      isActive: true,
      isPublic: true,
      isMature: false,
    },
    reviewerKey: `${kind}:${id}`,
    score,
    voiceReady: true,
    reasons: [`${name} affinity`],
    coverage,
  }
}

const broad = candidate(1, 'BOT', 'Broad Bot', 3)
const specialist = candidate(2, 'BOT', 'Specialist', 30)
const characterA = candidate(3, 'CHARACTER', 'Character A', 2)
const characterB = candidate(4, 'CHARACTER', 'Character B', 2)
const characterC = candidate(5, 'CHARACTER', 'Character C', 2)

const inputs = [
  { key: 1, candidates: [specialist, broad, characterA] },
  { key: 2, candidates: [broad, characterA, characterB] },
  { key: 3, candidates: [broad, characterA, characterB, characterC] },
]
const result = assignWonderLabReviewerPortfolio(inputs, {
  reviewersPerExhibit: 2,
  diversityPenalty: 4,
})

assert.equal(result.assignments[0]?.reviewers[0]?.reviewer.id, specialist.reviewer.id)
assert.ok(result.assignments.every((entry) => entry.reviewers.length === 2))
assert.ok(
  result.assignments.every(
    (entry) => new Set(entry.reviewers.map((reviewer) => reviewer.reviewer.kind)).size === 2,
  ),
)
const broadUsage = result.reviewerUsage.find((entry) => entry.id === broad.reviewer.id)?.count || 0
assert.ok(broadUsage < inputs.length, 'repeat-use penalty should prevent broad reviewer monopoly')
assert.ok(
  result.assignments.flatMap((entry) => entry.reviewers).some(
    (entry) => entry.reasons.some((reason) => reason.startsWith('portfolio balance:')),
  ),
)

const pinned = assignWonderLabReviewerPortfolio([
  {
    key: 9,
    candidates: [
      candidate(10, 'BOT', 'Published Bot', 1, 'PUBLISHED'),
      candidate(11, 'BOT', 'Higher Bot', 50),
      candidate(12, 'CHARACTER', 'Drafted Character', 1, 'DRAFTED'),
    ],
  },
], { reviewersPerExhibit: 2 })
assert.deepEqual(
  pinned.assignments[0]?.reviewers.map((entry) => entry.reviewer.id),
  [10, 12],
  'existing published and drafted editorial work should remain pinned',
)

const deterministic = assignWonderLabReviewerPortfolio(inputs, {
  reviewersPerExhibit: 2,
  diversityPenalty: 4,
})
assert.deepEqual(result, deterministic)

assert.equal(isWonderLabActiveEditorialDraft('PROPOSED'), true)
assert.equal(isWonderLabActiveEditorialDraft('APPROVED'), true)
assert.equal(isWonderLabActiveEditorialDraft('REJECTED'), false)
assert.equal(isWonderLabActiveEditorialDraft('FAILED'), false)
assert.equal(isWonderLabActiveEditorialDraft('SUPERSEDED'), false)

assert.equal(
  isWonderLabEditoriallyExcludedReviewer({ name: 'Princess Donut', slug: null }),
  true,
)
assert.equal(
  isWonderLabEditoriallyExcludedReviewer({ name: 'Other', slug: 'princess-donut' }),
  true,
)
assert.equal(
  isWonderLabEditoriallyExcludedReviewer({ name: 'Princess Doughnut', slug: null }),
  false,
)

console.log('WonderLab reviewer portfolio contract passed.')
