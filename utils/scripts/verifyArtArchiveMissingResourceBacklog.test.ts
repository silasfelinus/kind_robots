import assert from 'node:assert/strict'
import { buildMissingArchiveResourceBacklog } from '../../server/utils/artArchiveMissingResourceBacklog'

const metadata = (checkpoint: string, lora: string) => JSON.stringify({
  format: 'png',
  supported: true,
  a1111: {
    checkpoint,
    checkpointHash: null,
    loraTokens: [{ name: lora, weight: 0.8 }],
  },
  comfy: null,
})

const unresolved = (candidateIds: number[] = []) => ({
  outcome: {
    candidates: candidateIds.map((resourceId) => ({ resourceId, confidence: 'suggested' as const, evidence: 'path suggestion' })),
    unmatched: candidateIds.length ? null : { name: 'legacy-model', hash: null, weight: null },
  },
  appliedResourceId: null,
})

const resolved = {
  outcome: { candidates: [{ resourceId: 99, confidence: 'exact' as const, evidence: 'exact' }], unmatched: null },
  appliedResourceId: 99,
}

const entries = [
  {
    id: 1,
    artImageId: 101,
    relativePath: 'portraits/a.png',
    extractedMetadata: metadata('legacy-model', 'missing-lora'),
    matchSummary: JSON.stringify({ checkpoint: unresolved(), loras: [unresolved([7])] }),
  },
  {
    id: 2,
    artImageId: 102,
    relativePath: 'portraits/b.png',
    extractedMetadata: metadata('legacy-model.safetensors', 'missing-lora'),
    matchSummary: JSON.stringify({ checkpoint: unresolved(), loras: [unresolved([7])] }),
  },
  {
    id: 3,
    artImageId: 103,
    relativePath: 'portraits/c.png',
    extractedMetadata: metadata('now-resolved', 'resolved-lora'),
    matchSummary: JSON.stringify({ checkpoint: resolved, loras: [resolved] }),
  },
]

const backlog = buildMissingArchiveResourceBacklog(entries)
assert.equal(backlog.length, 2)

const checkpoint = backlog.find((item) => item.resourceType === 'CHECKPOINT')!
assert.equal(checkpoint.name, 'legacy-model')
assert.equal(checkpoint.occurrenceCount, 2)
assert.deepEqual(checkpoint.examples.map((item) => item.archiveEntryId), [1, 2])

const lora = backlog.find((item) => item.resourceType === 'LORA')!
assert.equal(lora.name, 'missing-lora')
assert.equal(lora.weight, 0.8)
assert.equal(lora.occurrenceCount, 2)
assert.deepEqual(lora.candidates.map((item) => item.resourceId), [7])
assert.equal(backlog.some((item) => item.name === 'now-resolved' || item.name === 'resolved-lora'), false)

console.log('verifyArtArchiveMissingResourceBacklog: unresolved evidence dedupes, keeps candidates/examples, and resolved resources disappear')
