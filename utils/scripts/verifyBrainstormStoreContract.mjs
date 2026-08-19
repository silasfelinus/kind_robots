import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const storePath = resolve(root, 'stores/brainstormStore.ts')
const typesPath = resolve(root, 'types/brainstorm.ts')
const lifecyclePath = resolve(
  root,
  'stores/helpers/brainstormCandidateLifecycle.ts',
)

const store = readFileSync(storePath, 'utf8')
const types = readFileSync(typesPath, 'utf8')
const lifecycle = readFileSync(lifecyclePath, 'utf8')

const failures = []

function requireText(source, needle, label) {
  if (!source.includes(needle)) failures.push(`${label}: missing ${needle}`)
}

function forbidText(source, needle, label) {
  if (source.includes(needle)) failures.push(`${label}: forbidden ${needle}`)
}

requireText(store, "defineStore('brainstormStore'", 'dedicated Pinia owner')
requireText(store, "'/api/brainstorm/generate'", 'canonical generation route')
requireText(store, 'useServerStore()', 'shared server-store reuse')
requireText(
  store,
  'serverStore.activeTextServer',
  'active text server selection',
)
requireText(
  store,
  'performFetch<BrainstormGenerateData>',
  'standard generation API client',
)
requireText(
  store,
  'localStorage.setItem(STORAGE_KEY',
  'store-owned local draft persistence',
)
requireText(store, 'SAVED_LINK_STORAGE_KEY', 'durable session linkage')
requireText(
  store,
  'localStorage.setItem(\n          SAVED_LINK_STORAGE_KEY',
  'store-owned durable linkage persistence',
)
requireText(
  store,
  "'/api/brainstorm/sessions'",
  'durable session collection route',
)
requireText(
  store,
  '`/api/brainstorm/sessions/${id}`',
  'durable session item route',
)
requireText(store, 'loadSavedSessions()', 'saved-session listing action')
requireText(store, 'saveCurrentSession()', 'saved-session create/update action')
requireText(
  store,
  'openSavedSession(id: number)',
  'saved-session reopen action',
)
requireText(store, 'detachSavedSession()', 'save-as-new action')
requireText(
  store,
  'restoreSession(JSON.stringify(saved.snapshot))',
  'shared safe restore contract',
)
requireText(
  store,
  'normalizeGeneratedCandidates(',
  'structured candidate validation',
)
requireText(store, 'replaceCandidateWithGenerated(', 'slot regeneration')
requireText(store, 'appendBranchCandidate(', 'candidate branching')
requireText(
  store,
  'restoreCandidateRevision(',
  'non-destructive revision restore',
)
requireText(store, "'branched'", 'branch revision history')
requireText(
  store,
  'child.meta.branchOrigin = computeBranchOrigin(parent)',
  'branch provenance snapshot',
)
requireText(
  store,
  'const batches = ref<BrainstormBatch[]>([])',
  'batch history',
)
requireText(
  store,
  'const activeBatchId = ref<string | null>(null)',
  'active batch identity',
)
requireText(
  store,
  'const savedSessionId = ref<number | null>(null)',
  'durable session identity',
)
requireText(
  store,
  'const savedSessions = ref<BrainstormSavedSessionSummary[]>([])',
  'saved-session summaries',
)

// conductor brainstorm/t-021: the pure normalizers and candidate
// state-transition logic moved out of this file into
// stores/helpers/brainstormCandidateLifecycle.ts (see that file's header
// comment for why -- brainstormStore.ts itself cannot be imported from a
// plain `tsx` process). The store must still visibly source its behavior
// from there, and the moved logic's own shape is checked against the file
// it actually lives in now; real behavioral coverage of what it DOES lives
// in verifyBrainstormCandidateLifecycle.test.ts, not here.
requireText(
  store,
  "} from '@/stores/helpers/brainstormCandidateLifecycle'",
  'candidate lifecycle logic sourced from the testable helper module',
)
requireText(lifecycle, "reason: 'edited'", 'edit revision history')
requireText(lifecycle, "reason: 'regenerated'", 'regeneration revision history')
requireText(lifecycle, "reason: 'restored'", 'restore revision history')
requireText(
  lifecycle,
  'branchOrigin = normalizeBranchOrigin',
  'restored branch-origin snapshots',
)
requireText(
  lifecycle,
  'revisionIndex: Math.max(0, parent.revisions.length - 1)',
  'exact parent revision lineage',
)
requireText(
  lifecycle,
  'export function computeBranchOrigin(',
  'branch-lineage logic testable without a live store',
)
requireText(
  lifecycle,
  'export function applyCandidateStatus(',
  'candidate status transitions testable without a live store',
)
requireText(
  lifecycle,
  'export function applyCandidateEdit(',
  'candidate edit transitions testable without a live store',
)
requireText(
  lifecycle,
  'export function applyCandidateRevisionRestore(',
  'revision-restore lineage testable without a live store',
)
requireText(
  lifecycle,
  'export function applyCandidateRegeneration(',
  'regeneration lineage testable without a live store',
)

forbidText(store, '/api/botcafe/brainstorm', 'legacy Dream endpoint')
forbidText(store, 'useDreamStore', 'Dream state ownership')
forbidText(store, 'usePitchStore', 'deleted Pitch ownership')
forbidText(store, 'usePromptStore', 'Prompt state ownership')
forbidText(store, 'temperature', 'provider knobs in creative state')
forbidText(store, 'maxTokens', 'provider knobs in creative state')

requireText(types, "'pending' | 'kept' | 'rejected'", 'candidate statuses')
requireText(types, 'BrainstormCandidateRevision', 'revision contract')
requireText(types, "| 'restored'", 'restored revision reason')
requireText(types, 'BrainstormBranchOrigin', 'branch origin contract')
requireText(types, 'revisionIndex: number', 'branch revision identity')
requireText(
  types,
  'branchOrigin?: BrainstormBranchOrigin | null',
  'candidate branch metadata',
)
requireText(types, 'batchId: string', 'candidate batch membership')
requireText(types, 'parentId?: string | null', 'candidate lineage')
requireText(
  types,
  'referenceCandidate?: BrainstormReferenceCandidate | null',
  'regeneration context',
)
requireText(types, 'BrainstormServerSnapshot', 'safe server snapshot')
requireText(types, 'BrainstormSessionSnapshot', 'ephemeral session contract')
requireText(
  types,
  'BrainstormSavedSessionSummary',
  'saved-session summary contract',
)
requireText(
  types,
  'BrainstormSessionSaveRequest',
  'saved-session write contract',
)
requireText(types, 'BrainstormPersistenceState', 'persistence state contract')
requireText(types, 'BRAINSTORM_MAX_RESULTS = 24', 'result-count ceiling')

if (/ref<[^>]*Promise/.test(store) || /ref\([^\n]*Promise/.test(store)) {
  failures.push('Pinia state must not store Promise values')
}

if (failures.length) {
  console.error('Brainstorm store contract failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Brainstorm store contract passed.')
