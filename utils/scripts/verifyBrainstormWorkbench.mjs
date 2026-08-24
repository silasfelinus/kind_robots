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
const store = readFileSync(resolve(root, 'stores/brainstormStore.ts'), 'utf8')
const content = readFileSync(resolve(root, 'content/brainstorm.md'), 'utf8')

assert.match(content, /:brainstorm-manager/)
assert.doesNotMatch(content, /:dream-manager|cards:\s*dreamCards/)

assert.match(manager, /useBrainstormStore\(\)/)
assert.match(manager, /store\.generateBatch\(\)/)
assert.match(manager, /store\.regenerateCandidate\(candidateId\)/)
assert.match(manager, /store\.branchCandidate\(candidateId\)/)
assert.match(manager, /store\.promoteCandidateToCharacter\(candidateId\)/)
assert.match(manager, /@promote="promoteCandidate\(candidate\.id\)"/)
assert.match(manager, /store\.restoreCandidateRevision\(candidateId, revisionIndex\)/)
assert.match(manager, /store\.saveCurrentSession\(\)/)
assert.match(manager, /store\.loadSavedSessions\(\)/)
assert.match(manager, /store\.openSavedSession\(id\)/)
assert.match(manager, /store\.detachSavedSession\(\)/)
assert.match(manager, /:parent-candidate="parentCandidateFor\(candidate\)"/)
assert.match(manager, /@restore-revision="restoreRevision\(candidate\.id, \$event\)"/)
assert.match(manager, /store\.keepCandidate\(candidateId\)/)
assert.match(manager, /store\.rejectCandidate\(candidateId\)/)
assert.match(manager, /store\.editCandidate\(candidateId, patch\)/)
assert.match(manager, /store\.removeCandidate\(candidateId\)/)
assert.match(manager, /store\.setCandidateFeedback\(candidateId, value\)/)
assert.match(manager, /store\.setMode\(direction\.id\)/)
assert.match(manager, /store\.setBatchShape\('focused'\)/)
assert.match(manager, /store\.setBatchShape\('assortment'\)/)
assert.match(manager, /store\.toggleReturnType\(option\.id\)/)
assert.match(manager, /store\.setReturnTypeCount\(id,/)
assert.match(manager, /data-testid="brainstorm-premise"/)
assert.match(manager, /data-testid="brainstorm-count"/)
assert.match(manager, /data-testid="brainstorm-creative-directions"/)
assert.match(manager, /data-testid="brainstorm-response-mix"/)
assert.match(manager, /data-testid="brainstorm-return-types"/)
assert.match(manager, /data-testid="brainstorm-saved-work"/)
assert.match(manager, /data-testid="brainstorm-session-name"/)
assert.match(manager, /data-testid="brainstorm-save-session"/)
assert.match(manager, /data-testid="brainstorm-save-as-new"/)
assert.match(manager, /data-testid="brainstorm-load-saved-list"/)
assert.match(manager, /data-testid="brainstorm-saved-session-list"/)
assert.match(manager, /data-testid="brainstorm-open-saved-session"/)
assert.match(manager, /data-testid="brainstorm-persistence-error"/)
assert.match(manager, /data-testid="brainstorm-kept-export"/)
assert.match(manager, /data-testid="brainstorm-copy-kept"/)
assert.match(manager, /data-testid="brainstorm-export-kept"/)
assert.match(manager, /navigator\.clipboard\.writeText/)
assert.doesNotMatch(manager, /data-testid="brainstorm-saved-session-select"/)
assert.match(manager, /Unsaved work stays private in this browser/)
assert.match(manager, /Signed-in saves are private to your account/)
assert.match(manager, /Focused/)
assert.match(manager, /Assortment/)
assert.match(manager, /Adaptive assortment/)
assert.match(manager, /How many\?/)
assert.match(manager, /placeholder="Auto"/)
assert.match(manager, /Pinned quotas plus one slot for each Auto lens/)
assert.match(manager, /BRAINSTORM_RETURN_TYPES/)
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
assert.match(card, /BRAINSTORM_RETURN_TYPES/)
assert.match(card, /data-testid="brainstorm-return-type-badge"/)
assert.match(card, /data-testid="brainstorm-revision-history"/)
assert.match(card, /data-testid="brainstorm-branch-lineage"/)
assert.match(card, /History · \{\{ candidate\.revisions\.length \}\} versions/)
assert.match(card, /Restore this version/)
assert.match(card, /Restoring is non-destructive/)
assert.match(card, /emit\('restoreRevision', entry\.index\)/)
assert.match(card, /Branch lineage · parent v/)
assert.match(card, /Jump to parent/)
assert.match(card, /Parent no longer in this batch/)
assert.match(card, /:id="`brainstorm-candidate-\$\{candidate\.id\}`"/)
assert.match(card, /emit\('keep'\)/)
assert.match(card, /emit\('reject'\)/)
assert.match(card, /emit\('reset'\)/)
assert.match(card, /emit\('edit'/)
assert.match(card, /emit\('regenerate'\)/)
assert.match(card, /emit\('branch'\)/)
assert.match(card, /emit\('promote'\)/)
assert.match(card, /data-testid="brainstorm-promote-to-character"/)
assert.match(card, /Promote to Character/)
assert.match(card, /More like this/)
assert.match(card, /Regenerate/)
assert.match(card, /Save edit/)
assert.match(card, /Cancel edit/)
assert.match(card, /What missed\?/)
assert.match(card, /Delete candidate/)
assert.doesNotMatch(card, /useBrainstormStore|\$fetch\(|performFetch\(|localStorage/)
assert.doesNotMatch(card, /(?:sm|md|lg|xl):grid-cols-/)

// The promote button is only offered on kept candidates -- guard against it
// silently regaining visibility on pending/rejected ones.
assert.match(
  card,
  /v-if="candidate\.status === 'kept'"\s*\n\s*type="button"\s*\n\s*class="btn btn-outline btn-sm"\s*\n\s*data-testid="brainstorm-promote-to-character"/,
  'the "Promote to Character" button must stay gated to kept candidates only',
)

// brainstorm/t-031: assert the promotion path actually carries
// meta.art.imageIds' most recent entry across as a single scalar artImageId
// -- not the whole array (Character's entityArt.ts model holds one art id
// per slot) and not silently dropped. Deliberately narrow, matching this
// file's own style: a source-text check, not a runtime mock of Pinia.
assert.match(
  store,
  /const imageIds = candidate\.meta\.art\?\.imageIds \?\? \[\]/,
  'promoteCandidateToCharacter must read candidate.meta.art.imageIds',
)
assert.match(
  store,
  /const artImageId = imageIds\.length\s*\n\s*\? imageIds\[imageIds\.length - 1\]\s*\n\s*: undefined/,
  'promoteCandidateToCharacter must pick a single scalar artImageId (the most recently delivered image) out of the array, not pass the array through',
)
assert.match(
  store,
  /await import\('@\/stores\/characterStore'\)/,
  "promoteCandidateToCharacter must dynamically import characterStore (avoids a static circular import, matching promptStore.promoteToDream's precedent)",
)
assert.match(
  store,
  /characterStore\.createCharacter\(\{[\s\S]*?artImageId,?\s*\}\)/,
  'promoteCandidateToCharacter must pass artImageId through to characterStore.createCharacter',
)

console.log('Brainstorm workbench contract passed.')
