// Contract for config/comment-calibration-batch-003.json.
// Proves that the frozen prose is tied to the exact current prompt-builder inputs
// and remains fresh relative to the archive, canonical sample, and approved batch 001.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { characterVoiceSeeds } from '@/stores/seeds/characterVoices'
import {
  buildCommentDraftPrompt,
  type CommentExchangeShape,
} from '@/utils/comments/commentDraftPrompt'
import {
  buildVoiceEvidenceIndex,
  selectVoiceSamples,
  speakerKey,
  type ArchivedVoiceRecord,
} from '@/utils/comments/voiceEvidence'
import type { CommentTargetProfile } from '@/utils/comments/commentCasting'

type InputExchange = {
  canonicalOrder: number
  exchangeKey: string
  shape: CommentExchangeShape
  target: CommentTargetProfile
  speakerIds: number[]
  comparison: string
}

type Inputs = {
  version: number
  batchId: string
  minimumProductionCommit: string
  issueNumber: number
  purpose: string
  exchanges: InputExchange[]
}

type FrozenComment = {
  authorKind: 'CHARACTER'
  authorId: number
  authorName: string
  comment: string
}

type FrozenExchange = {
  canonicalOrder: number
  exchangeKey: string
  promptSha256: string
  shape: CommentExchangeShape
  target: { type: string; id: number; title: string }
  comparison: string
  comments: FrozenComment[]
}

type Batch = {
  version: number
  batchId: string
  minimumProductionCommit: string
  issueNumber: number
  reviewState: string
  authoring: {
    mode: string
    model: string
    generationEnvironment: string
    runtimeCaller: string
    humanPolish: string
    generationAttempt: number
    note: string
  }
  provenance: {
    promptBuilder: string
    promptBuilderBlobSha: string
    voiceEvidenceModule: string
    voiceEvidenceBlobSha: string
    characterVoiceSeeds: string
    characterVoiceSeedsBlobSha: string
    inputManifest: string
    promptRenderer: string
    githubActionsJobId: number
    archiveSelection: string
    publication: string
  }
  coverage: {
    exchanges: number
    rewardTargets: number
    facetTargets: number
    shapes: Record<string, number>
    speakerSlots: number
    distinctSpeakers: number
    repeatedSpeakers: string[]
    wordRange: { minimum: number; maximum: number }
  }
  exchanges: FrozenExchange[]
}

type ApprovedBatch = {
  exchanges?: Array<{
    speakers?: Array<{
      kind?: string
      id?: number
      comment?: string
    }>
  }>
}

const repoRoot = process.cwd()
const configDir = join(repoRoot, 'config')
const inputs = JSON.parse(
  readFileSync(join(configDir, 'comment-calibration-batch-003-inputs.json'), 'utf8'),
) as Inputs
const batch = JSON.parse(
  readFileSync(join(configDir, 'comment-calibration-batch-003.json'), 'utf8'),
) as Batch
const approved = JSON.parse(
  readFileSync(join(configDir, 'comment-calibration-batch-001.json'), 'utf8'),
) as ApprovedBatch

assert.equal(inputs.version, 1)
assert.equal(inputs.batchId, 'comment-calibration-003')
assert.equal(batch.version, 1)
assert.equal(batch.batchId, inputs.batchId)
assert.equal(batch.minimumProductionCommit, inputs.minimumProductionCommit)
assert.equal(batch.issueNumber, 1769)
assert.equal(batch.reviewState, 'PENDING_HUMAN_REVIEW')
assert.equal(batch.authoring.mode, 'GPT_5_6_SOL_EXACT_PROMPT_BUILDER_REPLAY')
assert.equal(batch.authoring.model, 'GPT-5.6 Sol')
assert.equal(batch.authoring.runtimeCaller, 'ABSENT_IN_REPOSITORY')
assert.equal(batch.authoring.humanPolish, 'NONE_BEFORE_REVIEW')
assert.equal(batch.authoring.generationAttempt, 1)
assert.ok(batch.authoring.note.length > 80, 'authoring provenance needs a real explanation')
assert.equal(batch.provenance.publication, 'NOT_PUBLISHED')
assert.equal(batch.provenance.promptBuilder, 'utils/comments/commentDraftPrompt.ts')
assert.equal(batch.provenance.promptBuilderBlobSha, 'a41c5e7f185733f9ca2bd3debdc87f40306cc281')
assert.equal(batch.provenance.voiceEvidenceBlobSha, 'cf017adfd8a7ac66a39418026b86670539481f3c')
assert.equal(batch.provenance.characterVoiceSeedsBlobSha, '759cf59b71d47ba9a39df1944fe33e0e3de8fb95')
assert.ok(Number.isInteger(batch.provenance.githubActionsJobId) && batch.provenance.githubActionsJobId > 0)

// A calibration artifact must never masquerade as rows waiting to be written.
const serialized = JSON.stringify(batch)
for (const forbidden of ['reactionId', 'componentId', 'sourceKey', 'publishedAt', 'rating', 'reactionType']) {
  assert.doesNotMatch(serialized, new RegExp(`"${forbidden}"`), `${forbidden} implies production-row semantics`)
}

const archiveFiles = readdirSync(configDir)
  .filter((name) => /^wonderlab-voice-polish-batch-\d+\.json$/.test(name))
  .sort()
const rawRecords: ArchivedVoiceRecord[] = archiveFiles.flatMap((name) => {
  const parsed = JSON.parse(readFileSync(join(configDir, name), 'utf8')) as {
    revisions?: ArchivedVoiceRecord[]
  }
  return parsed.revisions || []
})
assert.equal(archiveFiles.length, 39, 'voice archive file count drifted')
assert.equal(rawRecords.length, 758, 'voice archive raw row count drifted')
const voiceIndex = buildVoiceEvidenceIndex(rawRecords)
assert.equal(voiceIndex.size, 278, 'voice archive speaker count drifted')
const keptDrafts = [...voiceIndex.values()].flatMap((entry) => entry.samples)
assert.equal(keptDrafts.length, 706, 'voice archive dedupe count drifted')

function normalizeWords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function shingles(value: string, size = 8): Set<string> {
  const words = normalizeWords(value)
  const out = new Set<string>()
  for (let start = 0; start + size <= words.length; start += 1) {
    out.add(words.slice(start, start + size).join(' '))
  }
  return out
}

function assertNoEightWordReuse(freshText: string, sourceText: string, label: string): void {
  const fresh = shingles(freshText)
  for (const shingle of shingles(sourceText)) {
    assert.ok(!fresh.has(shingle), `${label}: reuses archived/canonical phrase "${shingle}"`)
  }
}

const approvedBySpeaker = new Map<string, string[]>()
for (const exchange of approved.exchanges || []) {
  for (const speaker of exchange.speakers || []) {
    if (!speaker.kind || !speaker.id || !speaker.comment) continue
    const key = `${speaker.kind}:${speaker.id}`
    approvedBySpeaker.set(key, [...(approvedBySpeaker.get(key) || []), speaker.comment])
  }
}

assert.equal(inputs.exchanges.length, 8, 'batch 003 input count drifted')
assert.equal(batch.exchanges.length, inputs.exchanges.length, 'batch 003 output count drifted')

const expectedPerShape: Record<CommentExchangeShape, number> = {
  SOLO: 1,
  DUET: 2,
  DUET_REPLY: 2,
  TRIO: 3,
}
const shapeTally: Record<string, number> = { SOLO: 0, DUET: 0, DUET_REPLY: 0, TRIO: 0 }
const speakerCounts = new Map<string, number>()
const allWordCounts: number[] = []
let rewardTargets = 0
let facetTargets = 0
let speakerSlots = 0
const banned = /\b(component|wonderlab|museum|exhibit|star rating|stars|rating|review)\b/i

for (const [position, input] of inputs.exchanges.entries()) {
  const output = batch.exchanges[position]
  assert.ok(output, `missing output at ${position + 1}`)
  assert.equal(input.canonicalOrder, position + 1, `${input.exchangeKey}: input order drifted`)
  assert.equal(output.canonicalOrder, input.canonicalOrder, `${input.exchangeKey}: output order drifted`)
  assert.equal(output.exchangeKey, input.exchangeKey, `${input.exchangeKey}: key drifted`)
  assert.equal(output.shape, input.shape, `${input.exchangeKey}: shape drifted`)
  assert.equal(output.comparison, input.comparison, `${input.exchangeKey}: comparison note drifted`)
  assert.deepEqual(
    output.target,
    { type: input.target.type, id: input.target.id, title: input.target.title },
    `${input.exchangeKey}: target identity drifted`,
  )
  assert.ok(input.target.type === 'REWARD' || input.target.type === 'FACET', `${input.exchangeKey}: Resource remains deferred`)
  if (input.target.type === 'REWARD') rewardTargets += 1
  else facetTargets += 1

  shapeTally[input.shape] += 1
  assert.equal(output.comments.length, expectedPerShape[input.shape], `${input.exchangeKey}: comment count does not match shape`)
  assert.equal(output.comments.length, input.speakerIds.length, `${input.exchangeKey}: speaker count drifted`)

  const promptSpeakers = input.speakerIds.map((id) => {
    const seed = characterVoiceSeeds.find((candidate) => candidate.id === id)
    assert.ok(seed, `${input.exchangeKey}: missing character seed ${id}`)
    const evidence = voiceIndex.get(speakerKey({ kind: 'CHARACTER', id }))
    return {
      seed,
      evidence,
      promptSpeaker: {
        kind: 'CHARACTER' as const,
        id,
        name: seed.name,
        canonicalVoice: seed.voice,
        sampleResponse: seed.sampleResponse,
        archivedVoiceSamples: selectVoiceSamples(evidence, 4).map((sample) => sample.text),
      },
    }
  })
  const prompt = buildCommentDraftPrompt(
    input.target,
    promptSpeakers.map((speaker) => speaker.promptSpeaker),
    { shape: input.shape, maxSpeakers: input.shape === 'TRIO' ? 3 : 2 },
  )
  const promptHash = createHash('sha256').update(JSON.stringify(prompt)).digest('hex')
  assert.equal(output.promptSha256, promptHash, `${input.exchangeKey}: exact prompt fingerprint drifted`)

  for (const [speakerPosition, comment] of output.comments.entries()) {
    const expectedId = input.speakerIds[speakerPosition]
    const source = promptSpeakers[speakerPosition]
    assert.ok(source, `${input.exchangeKey}: source speaker missing`)
    assert.equal(comment.authorKind, 'CHARACTER')
    assert.equal(comment.authorId, expectedId, `${input.exchangeKey}: author order drifted`)
    assert.equal(comment.authorName, source.seed.name, `${input.exchangeKey}: author name drifted`)
    assert.ok(comment.comment.trim().length > 0 && comment.comment.length <= 1200, `${input.exchangeKey}: invalid comment length`)
    assert.doesNotMatch(comment.comment, banned, `${input.exchangeKey}: ${comment.authorName} slipped into reviewer/museum language`)

    const words = normalizeWords(comment.comment).length
    allWordCounts.push(words)
    speakerSlots += 1
    const key = speakerKey({ kind: 'CHARACTER', id: expectedId })
    speakerCounts.set(key, (speakerCounts.get(key) || 0) + 1)

    for (const sample of source.evidence?.samples || []) {
      assertNoEightWordReuse(comment.comment, sample.text, `${input.exchangeKey}: ${comment.authorName}`)
    }
    if (source.seed.sampleResponse) {
      assertNoEightWordReuse(comment.comment, source.seed.sampleResponse, `${input.exchangeKey}: ${comment.authorName} canonical sample`)
    }
    for (const approvedComment of approvedBySpeaker.get(key) || []) {
      assertNoEightWordReuse(comment.comment, approvedComment, `${input.exchangeKey}: ${comment.authorName} batch 001`)
    }
  }
}

// Fresh within the new batch too: Clank appears twice to prove cross-target voice,
// but should not get there by repeating the same sentence skeleton verbatim.
for (let left = 0; left < batch.exchanges.length; left += 1) {
  for (let right = left + 1; right < batch.exchanges.length; right += 1) {
    for (const a of batch.exchanges[left]!.comments) {
      for (const b of batch.exchanges[right]!.comments) {
        if (a.authorKind === b.authorKind && a.authorId === b.authorId) {
          assertNoEightWordReuse(a.comment, b.comment, `${a.authorName}: repeated inside batch 003`)
        }
      }
    }
  }
}

const repeatedSpeakers = [...speakerCounts.entries()]
  .filter(([, count]) => count > 1)
  .map(([key]) => key)
  .sort()
const minimumWords = Math.min(...allWordCounts)
const maximumWords = Math.max(...allWordCounts)
assert.equal(batch.coverage.exchanges, batch.exchanges.length)
assert.equal(batch.coverage.rewardTargets, rewardTargets)
assert.equal(batch.coverage.facetTargets, facetTargets)
assert.deepEqual(batch.coverage.shapes, shapeTally)
assert.equal(batch.coverage.speakerSlots, speakerSlots)
assert.equal(batch.coverage.distinctSpeakers, speakerCounts.size)
assert.deepEqual([...batch.coverage.repeatedSpeakers].sort(), repeatedSpeakers)
assert.equal(batch.coverage.wordRange.minimum, minimumWords)
assert.equal(batch.coverage.wordRange.maximum, maximumWords)
assert.deepEqual(repeatedSpeakers, ['CHARACTER:147'], 'Maestro Clank must be the deliberate cross-target repeat')
assert.ok(minimumWords <= 20, 'batch 003 should retain at least one genuinely short comment')
assert.ok(maximumWords >= 35, 'batch 003 should retain some room for longer character cadence')

console.log(
  `Comment calibration batch 003 passed — ${batch.exchanges.length} exact prompt replays, ` +
    `${speakerSlots} speaker slots, ${speakerCounts.size} distinct speakers, word range ${minimumWords}-${maximumWords}.`,
)
