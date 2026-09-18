// /utils/scripts/verifyArtArchiveResourceMatch.test.ts
//
// Self-test for the Art Archive resource-matching module (art-archive/t-006):
// tier ordering (hash > exact name > normalized basename > folder/file-name
// suggestion), ambiguous ties within a tier, type separation between
// CHECKPOINT and LORA/LYCORIS pools, unmatched-evidence retention for the
// t-021 backlog, unsupported-format short-circuiting, and the structural
// isMature/isPublic independence invariant.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { ResourceType } from '../../prisma/generated/prisma/client'
import { matchArchiveResources } from '../../server/utils/artArchiveResourceMatch'
import type { ExtractedArchiveMetadata } from '../../server/utils/artArchiveMetadata'

type Row = {
  id: number
  resourceType: ResourceType
  name: string
  customLabel: string | null
  localPath: string | null
  hash: string | null
}

function poolOf(rows: Row[]) {
  return {
    findMany: async () => rows,
  }
}

function row(overrides: Partial<Row> & { id: number; name: string; resourceType: ResourceType }): Row {
  return { customLabel: null, localPath: null, hash: null, ...overrides }
}

function pngMetadata(a1111: Partial<ExtractedArchiveMetadata & { format: 'png' }> = {}): ExtractedArchiveMetadata {
  return {
    format: 'png',
    supported: true,
    rawTextChunks: {},
    a1111: null,
    comfy: null,
    ...a1111,
  } as ExtractedArchiveMetadata
}

async function testHashOutranksName() {
  const metadata = pngMetadata({
    a1111: {
      prompt: 'x',
      negativePrompt: '',
      steps: null,
      sampler: null,
      cfg: null,
      seed: null,
      checkpoint: 'wrongName',
      checkpointHash: 'abc123',
      size: null,
      loraTokens: [],
      raw: '',
    },
  })
  const pool = poolOf([
    row({ id: 1, resourceType: ResourceType.CHECKPOINT, name: 'wrongName', hash: 'zzz999' }),
    row({ id: 2, resourceType: ResourceType.CHECKPOINT, name: 'rightHashOwner', hash: 'ABC123' }),
  ])
  const result = await matchArchiveResources(metadata, 'a/b.png', 'a', pool)
  assert.equal(result.checkpoint?.candidates.length, 1)
  assert.equal(result.checkpoint?.candidates[0]?.resourceId, 2)
  assert.equal(result.checkpoint?.candidates[0]?.confidence, 'hash')
  console.log('verifyArtArchiveResourceMatch: hash tier outranks a conflicting name match')
}

async function testNormalizedBasenameMatch() {
  const metadata = pngMetadata({
    a1111: {
      prompt: 'x',
      negativePrompt: '',
      steps: null,
      sampler: null,
      cfg: null,
      seed: null,
      checkpoint: 'RealisticVision_V51.safetensors',
      checkpointHash: null,
      size: null,
      loraTokens: [],
      raw: '',
    },
  })
  const pool = poolOf([row({ id: 5, resourceType: ResourceType.CHECKPOINT, name: 'realisticvisionv51' })])
  const result = await matchArchiveResources(metadata, 'a/b.png', 'a', pool)
  assert.equal(result.checkpoint?.candidates.length, 1)
  assert.equal(result.checkpoint?.candidates[0]?.resourceId, 5)
  assert.equal(result.checkpoint?.candidates[0]?.confidence, 'exact')
  console.log('verifyArtArchiveResourceMatch: normalized basename match tolerates extension/case/separator noise')
}

async function testAmbiguousTieSurfacesBoth() {
  const metadata = pngMetadata({
    a1111: {
      prompt: 'x',
      negativePrompt: '',
      steps: null,
      sampler: null,
      cfg: null,
      seed: null,
      checkpoint: 'sharedName',
      checkpointHash: null,
      size: null,
      loraTokens: [],
      raw: '',
    },
  })
  const pool = poolOf([
    row({ id: 7, resourceType: ResourceType.CHECKPOINT, name: 'sharedName' }),
    row({ id: 8, resourceType: ResourceType.CHECKPOINT, name: 'other', customLabel: 'sharedName' }),
  ])
  const result = await matchArchiveResources(metadata, 'a/b.png', 'a', pool)
  assert.equal(result.checkpoint?.candidates.length, 2)
  assert.equal(result.checkpoint?.unmatched, null)
  console.log('verifyArtArchiveResourceMatch: a same-tier tie surfaces both candidates instead of picking one')
}

async function testFolderSuggestionTierAndUnmatchedBacklog() {
  const metadata = pngMetadata({
    a1111: {
      prompt: 'x',
      negativePrompt: '',
      steps: null,
      sampler: null,
      cfg: null,
      seed: null,
      checkpoint: 'totallyUnknownModel',
      checkpointHash: null,
      size: null,
      loraTokens: [],
      raw: '',
    },
  })
  const poolWithFolderClue = poolOf([
    row({ id: 9, resourceType: ResourceType.CHECKPOINT, name: 'cozystyle' }),
  ])
  const suggested = await matchArchiveResources(metadata, 'CozyStyle/img.png', 'CozyStyle', poolWithFolderClue)
  assert.equal(suggested.checkpoint?.candidates.length, 1)
  assert.equal(suggested.checkpoint?.candidates[0]?.confidence, 'suggested')

  const poolWithNoClue = poolOf([row({ id: 10, resourceType: ResourceType.CHECKPOINT, name: 'unrelated' })])
  const unmatched = await matchArchiveResources(metadata, 'misc/img.png', 'misc', poolWithNoClue)
  assert.equal(unmatched.checkpoint?.candidates.length, 0)
  assert.deepEqual(unmatched.checkpoint?.unmatched, {
    name: 'totallyUnknownModel',
    hash: null,
    weight: null,
  })
  console.log('verifyArtArchiveResourceMatch: folder-name suggestion tier + unmatched evidence retained for backlog')
}

async function testCheckpointAndLoraPoolsStaySeparate() {
  const metadata = pngMetadata({
    a1111: {
      prompt: 'x',
      negativePrompt: '',
      steps: null,
      sampler: null,
      cfg: null,
      seed: null,
      checkpoint: 'sameName',
      checkpointHash: null,
      size: null,
      loraTokens: [{ name: 'sameName', weight: 0.8 }],
      raw: '',
    },
  })
  const pool = poolOf([
    row({ id: 11, resourceType: ResourceType.CHECKPOINT, name: 'sameName' }),
    row({ id: 12, resourceType: ResourceType.LORA, name: 'sameName' }),
  ])
  const result = await matchArchiveResources(metadata, 'a/b.png', 'a', pool)
  assert.equal(result.checkpoint?.candidates[0]?.resourceId, 11)
  assert.equal(result.loras[0]?.candidates[0]?.resourceId, 12)
  console.log('verifyArtArchiveResourceMatch: CHECKPOINT and LORA/LYCORIS pools never cross-match')
}

async function testUnsupportedFormatShortCircuits() {
  const metadata: ExtractedArchiveMetadata = { format: 'jpeg', supported: false }
  const result = await matchArchiveResources(metadata, 'a/b.jpg', 'a', poolOf([]))
  assert.equal(result.checkpoint, null)
  assert.deepEqual(result.loras, [])
  console.log('verifyArtArchiveResourceMatch: unsupported format returns no evidence rather than guessing')
}

function testMaturityIndependenceInvariant() {
  const source = fs.readFileSync('server/utils/artArchiveResourceMatch.ts', 'utf8')
  const code = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
  assert.equal(/isMature|isPublic/.test(code), false)
  console.log('verifyArtArchiveResourceMatch: source code (outside comments) never references isMature/isPublic')
}

async function run() {
  await testHashOutranksName()
  await testNormalizedBasenameMatch()
  await testAmbiguousTieSurfacesBoth()
  await testFolderSuggestionTierAndUnmatchedBacklog()
  await testCheckpointAndLoraPoolsStaySeparate()
  await testUnsupportedFormatShortCircuits()
  testMaturityIndependenceInvariant()
  console.log('verifyArtArchiveResourceMatch: all assertions passed')
}

run()
