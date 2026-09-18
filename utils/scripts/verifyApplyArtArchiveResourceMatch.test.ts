// /utils/scripts/verifyApplyArtArchiveResourceMatch.test.ts
//
// Self-test for art-archive/t-007's apply module
// (server/utils/applyArtArchiveResourceMatch.ts): defensible-unique
// application (hash/exact tier, no tie), ambiguous ties and 'suggested'-tier
// matches held back for review instead of applied, unmatched evidence never
// blocking an otherwise-confirmed sibling field, LoRA id dedupe, and the
// locked/no-image/no-metadata/no-evidence skip paths never touching the
// write delegates.
import assert from 'node:assert/strict'
import { ResourceType } from '../../prisma/generated/prisma/client'
import {
  applyArchiveEntryResourceMatch,
  computeArchiveResourceMatch,
  type ArchiveEntryForMatch,
} from '../../server/utils/applyArtArchiveResourceMatch'
import type { ArtImageResourceMatch, ResourceMatchOutcome } from '../../server/utils/artArchiveResourceMatch'
import type { ExtractedArchiveMetadata } from '../../server/utils/artArchiveMetadata'

function outcome(candidates: ResourceMatchOutcome['candidates'], unmatched: ResourceMatchOutcome['unmatched'] = null): ResourceMatchOutcome {
  return { candidates, unmatched }
}

function testConfirmedWhenEveryFieldUniqueAndDefensible() {
  const match: ArtImageResourceMatch = {
    checkpoint: outcome([{ resourceId: 1, confidence: 'hash', evidence: 'hash match' }]),
    loras: [outcome([{ resourceId: 2, confidence: 'exact', evidence: 'exact name match' }])],
  }
  const result = computeArchiveResourceMatch(match)
  assert.equal(result.matchState, 'CONFIRMED')
  assert.equal(result.checkpointResourceId, 1)
  assert.deepEqual(result.loraResourceIds, [2])
  console.log('verifyApplyArtArchiveResourceMatch: unique hash/exact matches on every field roll up to CONFIRMED')
}

function testAmbiguousTieHeldBack() {
  const match: ArtImageResourceMatch = {
    checkpoint: outcome([
      { resourceId: 1, confidence: 'exact', evidence: 'a' },
      { resourceId: 2, confidence: 'exact', evidence: 'b' },
    ]),
    loras: [],
  }
  const result = computeArchiveResourceMatch(match)
  assert.equal(result.matchState, 'AMBIGUOUS')
  assert.equal(result.checkpointResourceId, null)
  assert.equal(result.summary.checkpoint?.outcome.candidates.length, 2)
  console.log('verifyApplyArtArchiveResourceMatch: an ambiguous same-tier tie is never auto-applied')
}

function testSuggestedTierHeldBack() {
  const match: ArtImageResourceMatch = {
    checkpoint: outcome([{ resourceId: 1, confidence: 'suggested', evidence: 'folder text' }]),
    loras: [],
  }
  const result = computeArchiveResourceMatch(match)
  assert.equal(result.matchState, 'SUGGESTED')
  assert.equal(result.checkpointResourceId, null)
  console.log("verifyApplyArtArchiveResourceMatch: a unique but 'suggested'-tier match is never auto-applied")
}

function testUnmatchedSiblingDoesNotBlockConfirmed() {
  const match: ArtImageResourceMatch = {
    checkpoint: outcome([{ resourceId: 1, confidence: 'hash', evidence: 'hash match' }]),
    loras: [outcome([], { name: 'unknownLora', hash: null, weight: 0.6 })],
  }
  const result = computeArchiveResourceMatch(match)
  assert.equal(result.matchState, 'CONFIRMED')
  assert.equal(result.checkpointResourceId, 1)
  assert.deepEqual(result.loraResourceIds, [])
  assert.deepEqual(result.summary.loras[0]?.outcome.unmatched, { name: 'unknownLora', hash: null, weight: 0.6 })
  console.log('verifyApplyArtArchiveResourceMatch: unmatched-evidence LoRA leaves backlog data without blocking a confirmed checkpoint')
}

function testLoraIdsDeduped() {
  const match: ArtImageResourceMatch = {
    checkpoint: null,
    loras: [
      outcome([{ resourceId: 9, confidence: 'exact', evidence: 'a' }]),
      outcome([{ resourceId: 9, confidence: 'hash', evidence: 'b' }]),
    ],
  }
  const result = computeArchiveResourceMatch(match)
  assert.deepEqual(result.loraResourceIds, [9])
  console.log('verifyApplyArtArchiveResourceMatch: the same Resource matched by two embedded tokens is only connected once')
}

type Call = { kind: 'artImage' | 'archiveEntry'; args: unknown }

function makeEntry(overrides: Partial<ArchiveEntryForMatch> = {}): ArchiveEntryForMatch {
  return {
    id: 1,
    artImageId: 100,
    relativePath: 'a/b.png',
    parentFolder: 'a',
    extractedMetadata: null,
    resourceMatchLocked: false,
    ...overrides,
  }
}

async function runApply(entry: ArchiveEntryForMatch, pool: { id: number; resourceType: ResourceType; name: string; customLabel: string | null; localPath: string | null; hash: string | null }[]) {
  const calls: Call[] = []
  const artImage = {
    update: async (args: unknown) => {
      calls.push({ kind: 'artImage', args })
    },
  }
  const archiveEntry = {
    update: async (args: unknown) => {
      calls.push({ kind: 'archiveEntry', args })
    },
  }
  const resource = { findMany: async () => pool }
  const result = await applyArchiveEntryResourceMatch(entry, resource, artImage, archiveEntry)
  return { result, calls }
}

async function testLockedEntrySkipsWithNoWrites() {
  const { result, calls } = await runApply(makeEntry({ resourceMatchLocked: true }), [])
  assert.equal(result.applied, false)
  assert.equal(result.skippedReason, 'locked')
  assert.equal(calls.length, 0)
  console.log('verifyApplyArtArchiveResourceMatch: a resourceMatchLocked entry is skipped with zero writes')
}

async function testNoArtImageSkipsWithNoWrites() {
  const { result, calls } = await runApply(makeEntry({ artImageId: null }), [])
  assert.equal(result.skippedReason, 'no-art-image')
  assert.equal(calls.length, 0)
  console.log('verifyApplyArtArchiveResourceMatch: an entry with no artImageId is skipped with zero writes')
}

async function testMalformedMetadataSkipsWithNoWrites() {
  const { result, calls } = await runApply(makeEntry({ extractedMetadata: '{not json' }), [])
  assert.equal(result.skippedReason, 'no-metadata')
  assert.equal(calls.length, 0)
  console.log('verifyApplyArtArchiveResourceMatch: unparseable extractedMetadata is skipped with zero writes')
}

async function testNoEvidenceSkipsWithNoWrites() {
  const metadata: ExtractedArchiveMetadata = { format: 'jpeg', supported: false }
  const { result, calls } = await runApply(makeEntry({ extractedMetadata: JSON.stringify(metadata) }), [])
  assert.equal(result.skippedReason, 'no-evidence')
  assert.equal(calls.length, 0)
  console.log('verifyApplyArtArchiveResourceMatch: a file with no embedded checkpoint/LoRA evidence is skipped with zero writes')
}

async function testHappyPathWritesBothTables() {
  const metadata: ExtractedArchiveMetadata = {
    format: 'png',
    supported: true,
    rawTextChunks: {},
    a1111: {
      prompt: 'x',
      negativePrompt: '',
      steps: null,
      sampler: null,
      cfg: null,
      seed: null,
      checkpoint: 'realVision',
      checkpointHash: 'deadbeef',
      size: null,
      loraTokens: [{ name: 'styleLora', weight: 0.7 }],
      raw: '',
    },
    comfy: null,
  }
  const pool = [
    { id: 42, resourceType: ResourceType.CHECKPOINT, name: 'realVision', customLabel: null, localPath: null, hash: 'DEADBEEF' },
    { id: 77, resourceType: ResourceType.LORA, name: 'styleLora', customLabel: null, localPath: null, hash: null },
  ]
  const entry = makeEntry({ extractedMetadata: JSON.stringify(metadata) })
  const { result, calls } = await runApply(entry, pool)

  assert.equal(result.applied, true)
  assert.equal(result.matchState, 'CONFIRMED')
  assert.equal(result.checkpointResourceId, 42)
  assert.deepEqual(result.loraResourceIds, [77])

  const artImageCall = calls.find((c) => c.kind === 'artImage')
  assert.deepEqual(artImageCall?.args, {
    where: { id: 100 },
    data: { checkpointResourceId: 42, LoraResources: { set: [{ id: 77 }] } },
  })

  const archiveEntryCall = calls.find((c) => c.kind === 'archiveEntry')
  const archiveEntryData = (archiveEntryCall?.args as { data: { matchState: string; matchSummary: string } }).data
  assert.equal(archiveEntryData.matchState, 'CONFIRMED')
  const summary = JSON.parse(archiveEntryData.matchSummary)
  assert.equal(summary.checkpoint.appliedResourceId, 42)
  assert.equal(summary.loras[0].appliedResourceId, 77)
  console.log('verifyApplyArtArchiveResourceMatch: a defensible unique match writes ArtImage and ArchiveEntry together')
}

async function run() {
  testConfirmedWhenEveryFieldUniqueAndDefensible()
  testAmbiguousTieHeldBack()
  testSuggestedTierHeldBack()
  testUnmatchedSiblingDoesNotBlockConfirmed()
  testLoraIdsDeduped()
  await testLockedEntrySkipsWithNoWrites()
  await testNoArtImageSkipsWithNoWrites()
  await testMalformedMetadataSkipsWithNoWrites()
  await testNoEvidenceSkipsWithNoWrites()
  await testHappyPathWritesBothTables()
  console.log('verifyApplyArtArchiveResourceMatch: all assertions passed')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
