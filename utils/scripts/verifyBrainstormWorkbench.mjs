import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const manager = readFileSync(
  resolve(root, 'components/brainstorm/brainstorm-manager.vue'),
  'utf8',
)
const card = readFileSync(
  resolve(root, 'components/brainstorm/brainstorm-candidate-card.vue'),
  'utf8',
)
const content = readFileSync(resolve(root, 'content/brainstorm.md'), 'utf8')

assert.match(content, /:brainstorm-manager/)
assert.doesNotMatch(content, /:dream-manager|cards:\s*dreamCards/)

assert.match(manager, /useBrainstormStore\(\)/)
assert.match(manager, /store\.generateBatch\(\)/)
assert.match(manager, /store\.regenerateCandidate\(candidateId\)/)
assert.match(manager, /store\.branchCandidate\(candidateId\)/)
assert.match(manager, /store\.keepCandidate\(candidateId\)/)
assert.match(manager, /store\.rejectCandidate\(candidateId\)/)
assert.match(manager, /store\.editCandidate\(candidateId, patch\)/)
assert.match(manager, /store\.removeCandidate\(candidateId\)/)
assert.match(manager, /store\.setCandidateFeedback\(candidateId, value\)/)
assert.match(manager, /store\.setMode\(direction\.id\)/)
assert.match(manager, /data-testid="brainstorm-premise"/)
assert.match(manager, /data-testid="brainstorm-count"/)
assert.match(manager, /data-testid="brainstorm-creative-directions"/)
assert.match(manager, /Open field/)
assert.match(manager, /Stranger/)
assert.match(manager, /More grounded/)
assert.match(manager, /Darker \/ funnier/)
assert.match(manager, /Shorter/)
assert.match(manager, /Different angle/)
assert.match(manager, /Genre shift/)
assert.match(manager, /Invert it/)
assert.match(manager, /Creative moves, not model knobs\./)
assert.match(manager, /starterPremises/)
assert.match(manager, /Bad ice cream/)
assert.match(manager, /Cartoon peril/)
assert.match(manager, /Safe does not mean bland\./)
assert.match(manager, /Add constraints or examples/)
assert.match(manager, /data-testid="brainstorm-candidates"/)
assert.match(manager, /data-testid="brainstorm-error"/)
assert.match(manager, /grid-cols-\[repeat\(auto-fit,minmax/)
assert.doesNotMatch(manager, /(?:sm|md|lg|xl):grid-cols-/)
assert.doesNotMatch(manager, /\$fetch\(|performFetch\(|localStorage/)
assert.doesNotMatch(manager, /temperature|maxTokens|topP|frequencyPenalty|presencePenalty/)

assert.match(card, /defineEmits/)
assert.match(card, /emit\('keep'\)/)
assert.match(card, /emit\('reject'\)/)
assert.match(card, /emit\('reset'\)/)
assert.match(card, /emit\('edit'/)
assert.match(card, /emit\('regenerate'\)/)
assert.match(card, /emit\('branch'\)/)
assert.match(card, /More like this/)
assert.match(card, /Regenerate/)
assert.match(card, /Save edit/)
assert.match(card, /Cancel edit/)
assert.match(card, /What missed\?/)
assert.match(card, /Delete candidate/)
assert.doesNotMatch(card, /useBrainstormStore|\$fetch\(|performFetch\(|localStorage/)
assert.doesNotMatch(card, /(?:sm|md|lg|xl):grid-cols-/)

console.log('Brainstorm workbench contract passed.')