import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const storePath = resolve(root, 'stores/brainstormStore.ts')
const typesPath = resolve(root, 'types/brainstorm.ts')

const store = readFileSync(storePath, 'utf8')
const types = readFileSync(typesPath, 'utf8')

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
requireText(store, 'serverStore.activeTextServer', 'active text server selection')
requireText(store, 'performFetch<BrainstormGenerateData>', 'standard API client')
requireText(store, 'localStorage.setItem(STORAGE_KEY', 'store-owned persistence')
requireText(store, 'normalizeGeneratedCandidates(', 'structured candidate validation')
requireText(store, 'replaceCandidateWithGenerated(', 'slot regeneration')
requireText(store, 'appendBranchCandidate(', 'candidate branching')
requireText(store, "reason: 'edited'", 'edit revision history')
requireText(store, "reason: 'regenerated'", 'regeneration revision history')
requireText(store, "'branched'", 'branch revision history')
requireText(store, 'const batches = ref<BrainstormBatch[]>([])', 'batch history')
requireText(store, 'const activeBatchId = ref<string | null>(null)', 'active batch identity')

forbidText(store, '/api/botcafe/brainstorm', 'legacy Dream endpoint')
forbidText(store, 'useDreamStore', 'Dream state ownership')
forbidText(store, 'usePitchStore', 'deleted Pitch ownership')
forbidText(store, 'temperature', 'provider knobs in creative state')
forbidText(store, 'maxTokens', 'provider knobs in creative state')

requireText(types, "'pending' | 'kept' | 'rejected'", 'candidate statuses')
requireText(types, 'BrainstormCandidateRevision', 'revision contract')
requireText(types, 'batchId: string', 'candidate batch membership')
requireText(types, 'parentId?: string | null', 'candidate lineage')
requireText(types, 'referenceCandidate?: BrainstormReferenceCandidate | null', 'regeneration context')
requireText(types, 'BrainstormServerSnapshot', 'safe server snapshot')
requireText(types, 'BrainstormSessionSnapshot', 'ephemeral session contract')
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
