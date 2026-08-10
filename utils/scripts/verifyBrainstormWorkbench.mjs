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
assert.match(manager, /store\.keepCandidate\(candidate\.id\)/)
assert.match(manager, /store\.rejectCandidate\(candidate\.id\)/)
assert.match(manager, /store\.editCandidate\(candidate\.id, patch\)/)
assert.match(manager, /store\.removeCandidate\(candidate\.id\)/)
assert.match(manager, /store\.setCandidateFeedback\(candidate\.id, value\)/)
assert.match(manager, /data-testid="brainstorm-premise"/)
assert.match(manager, /data-testid="brainstorm-count"/)
assert.match(manager, /Add constraints or examples/)
assert.match(manager, /data-testid="brainstorm-candidates"/)
assert.match(manager, /data-testid="brainstorm-error"/)
assert.match(manager, /grid-cols-\[repeat\(auto-fit,minmax/)
assert.doesNotMatch(manager, /(?:sm|md|lg|xl):grid-cols-/)
assert.doesNotMatch(manager, /\$fetch\(|performFetch\(|localStorage/)

assert.match(card, /defineEmits/)
assert.match(card, /'keep'|'keep'/)
assert.match(card, /'reject'|'reject'/)
assert.match(card, /emit\('edit'/)
assert.match(card, /emit\('regenerate'\)/)
assert.match(card, /emit\('branch'\)/)
assert.match(card, /More like this/)
assert.match(card, /Regenerate/)
assert.match(card, /Save edit/)
assert.match(card, /What missed\?/)
assert.match(card, /Delete candidate/)
assert.doesNotMatch(card, /useBrainstormStore|\$fetch\(|performFetch\(|localStorage/)
assert.doesNotMatch(card, /(?:sm|md|lg|xl):grid-cols-/)

console.log('Brainstorm workbench contract passed.')
