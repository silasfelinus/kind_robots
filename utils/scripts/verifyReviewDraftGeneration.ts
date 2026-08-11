// /utils/scripts/verifyReviewDraftGeneration.ts
//
// WonderLab's component-grounded review generator was retired on 2026-08-11.
// Keep this script name temporarily because package/workflow callers already
// reference it, but make the contract protect the new boundary: the museum
// generator stays gone while generic first-party Reaction authorship remains.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const retiredPaths = [
  'server/utils/wonderLabReviewDraftGenerator.ts',
  'server/utils/wonderLabReviewGroundingGate.ts',
  'server/api/admin/wonderlab/review-drafts/generate.post.ts',
  'pages/admin/wonderlab-review-generator.vue',
  'utils/wonderlab/reviewDraftGrounding.ts',
  'utils/wonderlab/reviewDraftPrompt.ts',
]

for (const path of retiredPaths) {
  assert.equal(
    existsSync(path),
    false,
    `${path} belongs to the retired WonderLab component-review generator`,
  )
}

const authorProjection = readFileSync(
  'utils/reactions/firstPartyReactionAuthor.ts',
  'utf8',
)
const repository = readFileSync('server/utils/reviewDraftRepository.ts', 'utf8')

assert.match(authorProjection, /authorBotId/)
assert.match(authorProjection, /authorCharacterId/)
assert.match(repository, /authorBotId/)
assert.match(repository, /authorCharacterId/)
assert.doesNotMatch(repository, /wonderLabSourceEvidenceByPath/)

console.log(
  'Review draft retirement contract passed: WonderLab generation is gone; generic first-party author infrastructure remains.',
)
