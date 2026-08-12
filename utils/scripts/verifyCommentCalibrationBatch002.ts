// /utils/scripts/verifyCommentCalibrationBatch002.ts
//
// Contract for config/comment-calibration-batch-002.json.
// This is deliberately separate from the batch-001 contract: the approved
// hand-authored gold set keeps its own rules, while this file tests whether a
// model-authored follow-up can reproduce the direction under harder conditions.
// Offline: no network, no database, no model call.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { rankCommentSpeakers } from '@/utils/comments/commentCasting'
import {
  buildVoiceEvidenceIndex,
  speakerKey,
  voiceEvidenceTier,
  type ArchivedVoiceRecord,
} from '@/utils/comments/voiceEvidence'

type Speaker = {
  order: number
  kind: 'BOT' | 'CHARACTER'
  id: number
  name: string
  score: number
  signals: {
    relationshipScore: number
    targetAffinityScore: number
    voiceEvidenceScore: number
    noveltyScore: number
  }
  reasons: string[]
  signalNotes: string[]
  voiceEvidence: { tier: 'RICH' | 'THIN' | 'SPARSE' | 'NONE'; sampleCount: number; draftIds: number[] }
  comment: string
  wordCount: number
  suggestedRating: number
  suggestedReactionType: string
}

type Exchange = {
  canonicalOrder: number
  exchangeKey: string
  shape: 'SOLO' | 'DUET' | 'DUET_REPLY' | 'TRIO'
  target: { type: string; id: number; title: string }
  speakers: Speaker[]
  contrastDirective: { speakerKey: string; note: string; slot?: number } | null
  curatorNote: string
}

type Batch = {
  version: number
  batchId: string
  minimumProductionCommit: string
  issueNumber: number
  authoring: {
    mode: string
    model: string
    humanPolish: string
    note: string
  }
  editorialContract: {
    publication: string
    invariants: string[]
    stressGoals: {
      repeatedVoiceTiers: string[]
      microReactionMaxWords: number
      longTurnMinWords: number
      humanPolishBeforeReview: boolean
    }
  }
  casting: { weights: Record<string, number> }
  coverage: {
    exchanges: number
    rewardTargets: number
    facetTargets: number
    shapes: Record<string, number>
    distinctSpeakers: number
    speakerSlots: number
    voiceTiers: Record<string, number>
    repeatedSpeakers: string[]
    repeatedVoiceTiers: string[]
    contrastDirectives: number
    wordRange: { minimum: number; maximum: number }
  }
  exchanges: Exchange[]
}

const repoRoot = process.cwd()
const configDir = join(repoRoot, 'config')

const archiveFiles = readdirSync(configDir)
  .filter((name) => /^wonderlab-voice-polish-batch-\d+\.json$/.test(name))
  .sort()

const rawRecords: ArchivedVoiceRecord[] = archiveFiles.flatMap((name) => {
  const parsed = JSON.parse(readFileSync(join(configDir, name), 'utf8')) as {
    revisions?: ArchivedVoiceRecord[]
  }
  return parsed.revisions || []
})

assert.equal(archiveFiles.length, 39, 'the voice archive is 39 batch files')
assert.equal(rawRecords.length, 758, 'the voice archive holds 758 raw rows')

const index = buildVoiceEvidenceIndex(rawRecords)
const keptDraftIds = new Set(
  [...index.values()].flatMap((entry) => entry.samples.map((sample) => sample.draftId)),
)

assert.equal(keptDraftIds.size, 706, '706 drafts survive dedupe')
assert.equal(rawRecords.length - keptDraftIds.size, 52, '52 drafts are superseded re-polishes')
assert.equal(index.size, 278, 'the archive covers 278 distinct speakers')

const ordered = rawRecords.filter((record) => typeof record.canonicalOrder === 'number')
assert.equal(ordered.length, 706, 'exactly 706 rows carry canonicalOrder')
for (const record of ordered) {
  assert.ok(keptDraftIds.has(record.draftId), `draft ${record.draftId} should survive dedupe`)
}
const orders = ordered.map((record) => record.canonicalOrder as number).sort((a, b) => a - b)
assert.deepEqual(orders, Array.from({ length: 706 }, (_, position) => position + 1))

const batch = JSON.parse(
  readFileSync(join(configDir, 'comment-calibration-batch-002.json'), 'utf8'),
) as Batch

assert.equal(batch.version, 1)
assert.equal(batch.batchId, 'comment-calibration-002')
assert.match(batch.minimumProductionCommit, /^[0-9a-f]{40}$/)
assert.equal(batch.issueNumber, 1769)
assert.equal(batch.authoring.mode, 'GPT_5_6_SOL_SESSION')
assert.equal(batch.authoring.model, 'GPT-5.6 Sol')
assert.equal(batch.authoring.humanPolish, 'NONE_BEFORE_REVIEW')
assert.ok(batch.authoring.note.trim().length > 40, 'authoring provenance needs a real note')
assert.equal(batch.editorialContract.publication, 'NOT_PUBLISHED')
assert.equal(batch.editorialContract.stressGoals.humanPolishBeforeReview, false)
assert.deepEqual(
  [...batch.editorialContract.stressGoals.repeatedVoiceTiers].sort(),
  ['RICH', 'SPARSE', 'THIN'],
)
assert.ok(batch.editorialContract.stressGoals.microReactionMaxWords <= 12)
assert.ok(batch.editorialContract.stressGoals.longTurnMinWords >= 60)

const serialized = JSON.stringify(
  batch,
  (key, value) => (key === 'voiceEvidence' ? undefined : value),
)
for (const forbidden of ['reactionId', 'componentId', 'sourceKey', 'publishedAt', 'draftId']) {
  assert.doesNotMatch(
    serialized,
    new RegExp(`"${forbidden}"`),
    `${forbidden} implies a production row this batch must not have`,
  )
}

const exchanges = batch.exchanges
assert.ok(exchanges.length >= 8 && exchanges.length <= 10, 'stress batch is 8-10 exchanges')
assert.equal(batch.coverage.exchanges, exchanges.length, 'coverage exchange count drifted')

const SPEAKERS_PER_SHAPE = { SOLO: 1, DUET: 2, DUET_REPLY: 2, TRIO: 3 } as const
const BANNED = /\b(component|wonderlab|museum|exhibit|star rating|stars|rating|review)\b/i

function shingles(value: string): Set<string> {
  const words = value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
  const out = new Set<string>()
  for (let start = 0; start + 8 <= words.length; start += 1) {
    out.add(words.slice(start, start + 8).join(' '))
  }
  return out
}

const seenKeys = new Set<string>()
const seenTargets = new Set<string>()
const allWordCounts: number[] = []
const shapeTally: Record<string, number> = {}
const tierTally: Record<string, number> = {}
const speakerAppearances = new Map<string, { count: number; tier: string }>()
let rewardTargets = 0
let facetTargets = 0
let contrastDirectives = 0
let speakerSlots = 0

exchanges.forEach((exchange, position) => {
  const where = exchange.exchangeKey
  assert.equal(exchange.canonicalOrder, position + 1, `${where}: canonicalOrder is contiguous`)
  assert.ok(!seenKeys.has(exchange.exchangeKey), `${where}: exchangeKey is unique`)
  seenKeys.add(exchange.exchangeKey)

  const targetKey = `${exchange.target.type}:${exchange.target.id}`
  assert.ok(!seenTargets.has(targetKey), `${where}: one exchange per target`)
  seenTargets.add(targetKey)

  assert.ok(
    exchange.target.type === 'REWARD' || exchange.target.type === 'FACET',
    `${where}: Resource is deferred and ${exchange.target.type} is out of scope`,
  )
  if (exchange.target.type === 'REWARD') rewardTargets += 1
  else facetTargets += 1

  const expected = SPEAKERS_PER_SHAPE[exchange.shape]
  assert.ok(expected, `${where}: unknown shape ${exchange.shape}`)
  assert.equal(exchange.speakers.length, expected, `${where}: ${exchange.shape} speaker count`)
  shapeTally[exchange.shape] = (shapeTally[exchange.shape] || 0) + 1
  speakerSlots += exchange.speakers.length
  assert.ok(exchange.curatorNote.trim().length > 40, `${where}: needs a real curator note`)

  const withinExchangeKeys = exchange.speakers.map((speaker) => speakerKey(speaker))
  assert.equal(
    new Set(withinExchangeKeys).size,
    withinExchangeKeys.length,
    `${where}: a speaker appears at most once within an exchange`,
  )

  if (exchange.contrastDirective) {
    contrastDirectives += 1
    assert.ok(
      exchange.contrastDirective.note.trim().length > 20,
      `${where}: contrast directive needs a real reason`,
    )
    assert.ok(
      withinExchangeKeys.includes(exchange.contrastDirective.speakerKey),
      `${where}: contrast directive names an uncast speaker`,
    )
  }

  const recast = rankCommentSpeakers(
    { type: 'FACET', id: exchange.target.id, title: exchange.target.title },
    exchange.speakers.map((speaker) => ({
      kind: speaker.kind,
      id: speaker.id,
      name: speaker.name,
      ...speaker.signals,
    })),
    exchange.speakers.length,
  )

  exchange.speakers.forEach((speaker, speakerPosition) => {
    assert.equal(speaker.order, speakerPosition + 1, `${where}: speaker order is contiguous`)
    const key = speakerKey(speaker)
    const previous = speakerAppearances.get(key)
    const timesAlreadyCast = previous?.count || 0
    const expectedNovelty = Math.max(0, 100 - timesAlreadyCast * 35)
    assert.equal(
      speaker.signals.noveltyScore,
      expectedNovelty,
      `${where}: ${speaker.name} novelty must decay from actual prior appearances`,
    )

    const live = recast.find((candidate) => speakerKey(candidate) === key)
    assert.ok(live, `${where}: ${speaker.name} vanished from re-ranking`)
    assert.ok(
      Math.abs(live.score - speaker.score) < 0.01,
      `${where}: ${speaker.name} recorded ${speaker.score}, module says ${live.score}`,
    )
    const rankedReasons = speaker.reasons.filter(
      (reason) => !reason.startsWith('deliberate contrast:'),
    )
    assert.deepEqual(rankedReasons, live.reasons, `${where}: ${speaker.name} reasons drifted`)

    for (const [name, value] of Object.entries(speaker.signals)) {
      assert.ok(
        Number.isFinite(value) && value >= 0 && value <= 100,
        `${where}: ${speaker.name} ${name} out of range`,
      )
    }

    const evidence = index.get(key)
    const tier = voiceEvidenceTier(evidence)
    assert.equal(tier, speaker.voiceEvidence.tier, `${where}: ${speaker.name} tier drifted`)
    assert.equal(
      evidence?.samples.length || 0,
      speaker.voiceEvidence.sampleCount,
      `${where}: ${speaker.name} sample count drifted`,
    )
    const ownedDraftIds = new Set((evidence?.samples || []).map((sample) => sample.draftId))
    for (const draftId of speaker.voiceEvidence.draftIds) {
      assert.ok(ownedDraftIds.has(draftId), `${where}: draft ${draftId} is not ${speaker.name}'s`)
      assert.ok(keptDraftIds.has(draftId), `${where}: draft ${draftId} was superseded`)
    }

    const text = speaker.comment.trim()
    assert.ok(text.length > 0 && text.length <= 1200, `${where}: ${speaker.name} comment length`)
    const actualWordCount = text.split(/\s+/).filter(Boolean).length
    assert.equal(actualWordCount, speaker.wordCount, `${where}: ${speaker.name} wordCount is wrong`)
    assert.doesNotMatch(text, BANNED, `${where}: ${speaker.name} wrote like a product reviewer`)
    assert.ok(
      speaker.suggestedRating >= 2 && speaker.suggestedRating <= 5,
      `${where}: ${speaker.name} rating out of range`,
    )
    assert.ok(
      ['LOVED', 'CLAPPED', 'NEUTRAL'].includes(speaker.suggestedReactionType),
      `${where}: ${speaker.name} reaction type`,
    )

    const fresh = shingles(text)
    for (const sample of evidence?.samples || []) {
      for (const shingle of shingles(sample.text)) {
        assert.ok(
          !fresh.has(shingle),
          `${where}: ${speaker.name} reuses an archived phrase - "${shingle}"`,
        )
      }
    }

    allWordCounts.push(speaker.wordCount)
    tierTally[tier] = (tierTally[tier] || 0) + 1
    speakerAppearances.set(key, { count: timesAlreadyCast + 1, tier })
  })
})

const repeated = [...speakerAppearances.entries()].filter(([, value]) => value.count > 1)
const repeatedKeys = repeated.map(([key]) => key).sort()
const repeatedTiers = [...new Set(repeated.map(([, value]) => value.tier))].sort()
const distinctSpeakers = speakerAppearances.size
const sortedWords = [...allWordCounts].sort((left, right) => left - right)
const minimumWords = sortedWords[0]!
const maximumWords = sortedWords[sortedWords.length - 1]!

assert.ok(repeated.length >= 3, 'stress batch needs at least three repeated speakers')
assert.deepEqual(repeatedTiers, ['RICH', 'SPARSE', 'THIN'], 'repeats must cover RICH/THIN/SPARSE')
assert.ok(minimumWords <= 12, `stress batch needs a <=12 word micro-reaction; minimum is ${minimumWords}`)
assert.ok(maximumWords >= 60, `stress batch needs a >=60 word long turn; maximum is ${maximumWords}`)
assert.ok(contrastDirectives >= 2, 'stress batch needs at least two explicit contrast directives')
assert.ok((shapeTally.SOLO || 0) >= 1, 'stress batch needs SOLO')
assert.ok((shapeTally.DUET || 0) >= 1, 'stress batch needs DUET')
assert.ok((shapeTally.DUET_REPLY || 0) >= 1, 'stress batch needs DUET_REPLY')
assert.equal(rewardTargets, batch.coverage.rewardTargets, 'Reward coverage drifted')
assert.equal(facetTargets, batch.coverage.facetTargets, 'Facet coverage drifted')
assert.equal(speakerSlots, batch.coverage.speakerSlots, 'speaker-slot coverage drifted')
assert.equal(distinctSpeakers, batch.coverage.distinctSpeakers, 'distinct-speaker coverage drifted')
assert.equal(contrastDirectives, batch.coverage.contrastDirectives, 'contrast coverage drifted')
assert.deepEqual(shapeTally, batch.coverage.shapes, 'shape coverage drifted')
assert.deepEqual(tierTally, batch.coverage.voiceTiers, 'voice-tier coverage drifted')
assert.deepEqual(repeatedKeys, [...batch.coverage.repeatedSpeakers].sort(), 'repeated-speaker coverage drifted')
assert.deepEqual(repeatedTiers, [...batch.coverage.repeatedVoiceTiers].sort(), 'repeated-tier coverage drifted')
assert.equal(minimumWords, batch.coverage.wordRange.minimum, 'minimum word range drifted')
assert.equal(maximumWords, batch.coverage.wordRange.maximum, 'maximum word range drifted')

console.log(
  `Comment calibration batch 002 passed - ${exchanges.length} exchanges, ` +
    `${speakerSlots} speaker slots, ${distinctSpeakers} distinct speakers, ` +
    `${repeated.length} repeats across ${repeatedTiers.join('/')}, word range ${minimumWords}-${maximumWords}.`,
)
