import assert from 'node:assert/strict'
import {
  answeredAudienceArt,
  audienceChoiceImages,
} from '../emperorOfDust/fortress/audienceChoiceArt'

// Decisions are saved as flags by chooseAudienceOption, including multi-beat
// choices. Reconstruct the final illustrated response after a save/reload.
const flags = [
  'chose:d22-blame:blame',
  'chose:d22-blame:ask-knife',
  'chose:d22-blame:ask-tokens',
]
const result = answeredAudienceArt(flags, 'd22-blame', 'ottoline-vask')
assert.ok(result)
assert.equal(result.optionId, 'ask-tokens')
assert.deepEqual(
  result.images,
  audienceChoiceImages('d22-blame', 'ask-tokens', 'ottoline-vask', 0),
)
assert.ok(result.images.length > 0)
assert.ok(result.images.every((url) => url.startsWith('/emperor-of-dust/')))
assert.equal(answeredAudienceArt(flags, 'unanswered'), undefined)
assert.equal(answeredAudienceArt(['chose:d22-blame:'], 'd22-blame'), undefined)
assert.equal(
  answeredAudienceArt(['chose:d22-blame:blame'], 'd22-blame:other'),
  undefined,
)
console.log('Emperor audience aftermath save/reload contract passed')
