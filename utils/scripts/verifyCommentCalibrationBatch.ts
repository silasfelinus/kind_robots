// /utils/scripts/verifyCommentCalibrationBatch.ts
//
// Contract for config/comment-calibration-batch-001.json and the voice archive
// it draws on. Offline: no network, no database, no model call.
//
// This turns the calibration manifest into a contract rather than a snapshot.
// Change the casting weights in commentCasting.ts and this goes red, because the
// recorded score for every speaker is recomputed from its recorded signals. Copy
// an archived line into a comment and this goes red too.
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
  voiceEvidence: { tier: string; sampleCount: number; draftIds: number[] }
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

const repoRoot = process.cwd()
const configDir = join(repoRoot, 'config')

// ---------------------------------------------------------------- archive

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

// Independent cross-check on the dedupe rule: the surviving drafts are exactly
// the rows carrying canonicalOrder, and those form a complete 1..706 run. Two
// derivations of the same set — if a future loader sorts batches wrongly, these
// disagree instead of silently resurrecting the 52 stale drafts.
const ordered = rawRecords.filter((record) => typeof record.canonicalOrder === 'number')
assert.equal(ordered.length, 706, 'exactly 706 rows carry canonicalOrder')
for (const record of ordered) {
  assert.ok(keptDraftIds.has(record.draftId), `draft ${record.draftId} should survive dedupe`)
}
const orders = ordered.map((record) => record.canonicalOrder as number).sort((a, b) => a - b)
assert.deepEqual(orders, Array.from({ length: 706 }, (_, position) => position + 1))

// ---------------------------------------------------------------- manifest

const batch = JSON.parse(
  readFileSync(join(configDir, 'comment-calibration-batch-001.json'), 'utf8'),
) as {
  version: number
  batchId: string
  minimumProductionCommit: string
  issueNumber: number
  authoring: { mode: string; note: string }
  editorialContract: { publication: string; invariants: string[] }
  casting: { weights: Record<string, number> }
  coverage: Record<string, unknown>
  exchanges: Exchange[]
}

assert.equal(batch.version, 1)
assert.match(batch.batchId, /^comment-calibration-\d{3}$/)
assert.match(batch.minimumProductionCommit, /^[0-9a-f]{40}$/)
assert.equal(batch.issueNumber, 1769)

// The calibration gate is the whole point: this batch must never claim to be
// published, and must never claim a model wrote it.
assert.equal(batch.authoring.mode, 'HAND_AUTHORED')
assert.equal(batch.editorialContract.publication, 'NOT_PUBLISHED')

// Nothing in here may look like a database row waiting to be written. draftIds
// under voiceEvidence are archive citations and are the only exception.
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
assert.ok(exchanges.length >= 12 && exchanges.length <= 20, 'calibration batch is 12-20 exchanges')

const SPEAKERS_PER_SHAPE = { SOLO: 1, DUET: 2, DUET_REPLY: 2, TRIO: 3 } as const
const BANNED = /\b(component|wonderlab|museum|exhibit|star rating|stars|rating|review)\b/i

const seenKeys = new Set<string>()
const seenTargets = new Set<string>()
const shapeTally: Record<string, number> = {}
const allWordCounts: number[] = []

exchanges.forEach((exchange, position) => {
  const where = `${exchange.exchangeKey}`

  assert.equal(exchange.canonicalOrder, position + 1, `${where}: canonicalOrder is contiguous`)
  assert.ok(!seenKeys.has(exchange.exchangeKey), `${where}: exchangeKey is unique`)
  seenKeys.add(exchange.exchangeKey)

  const targetKey = `${exchange.target.type}:${exchange.target.id}`
  assert.ok(!seenTargets.has(targetKey), `${where}: one exchange per target`)
  seenTargets.add(targetKey)

  // Phase one is Reward and Facet. Resource is deferred, and nothing else was
  // ever in scope — see docs/architecture/comment-migration-foundation.md.
  assert.ok(
    exchange.target.type === 'REWARD' || exchange.target.type === 'FACET',
    `${where}: target type ${exchange.target.type} is out of scope`,
  )

  const expected = SPEAKERS_PER_SHAPE[exchange.shape]
  assert.ok(expected, `${where}: unknown shape ${exchange.shape}`)
  assert.equal(exchange.speakers.length, expected, `${where}: ${exchange.shape} speaker count`)
  shapeTally[exchange.shape] = (shapeTally[exchange.shape] || 0) + 1

  assert.ok(exchange.curatorNote.trim().length > 40, `${where}: needs a real curator note`)

  const speakerKeys = exchange.speakers.map((speaker) => speakerKey(speaker))
  assert.equal(new Set(speakerKeys).size, speakerKeys.length, `${where}: no repeated speaker`)

  if (exchange.contrastDirective) {
    assert.ok(
      exchange.contrastDirective.note.trim().length > 20,
      `${where}: a contrast directive without a stated reason is not inspectable`,
    )
    assert.ok(
      speakerKeys.includes(exchange.contrastDirective.speakerKey),
      `${where}: the contrast directive names a speaker who is not cast`,
    )
  }

  // Casting integrity. Re-rank from the recorded signals and require the module
  // to produce the recorded score and reasons. This is what makes the manifest
  // fail loudly if the weighting policy changes underneath it.
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

  exchange.speakers.forEach((speaker) => {
    const live = recast.find((candidate) => speakerKey(candidate) === speakerKey(speaker))
    assert.ok(live, `${where}: ${speaker.name} vanished from the re-ranking`)
    assert.ok(
      Math.abs(live.score - speaker.score) < 0.01,
      `${where}: ${speaker.name} recorded ${speaker.score}, module says ${live.score}`,
    )
    // A contrast reason is appended by the curator, not by the ranker.
    const ranked = speaker.reasons.filter((reason) => !reason.startsWith('deliberate contrast:'))
    assert.deepEqual(ranked, live.reasons, `${where}: ${speaker.name} reasons drifted`)

    for (const [name, value] of Object.entries(speaker.signals)) {
      assert.ok(
        Number.isFinite(value) && value >= 0 && value <= 100,
        `${where}: ${speaker.name} ${name} out of range`,
      )
    }

    // Voice provenance: cited drafts must belong to this speaker and must have
    // survived dedupe, so no comment is grounded in a superseded polish.
    const evidence = index.get(speakerKey(speaker))
    assert.equal(
      voiceEvidenceTier(evidence),
      speaker.voiceEvidence.tier,
      `${where}: ${speaker.name} tier drifted`,
    )
    assert.equal(evidence?.samples.length || 0, speaker.voiceEvidence.sampleCount)
    const owned = new Set((evidence?.samples || []).map((sample) => sample.draftId))
    for (const draftId of speaker.voiceEvidence.draftIds) {
      assert.ok(owned.has(draftId), `${where}: draft ${draftId} is not ${speaker.name}'s`)
      assert.ok(keptDraftIds.has(draftId), `${where}: draft ${draftId} was superseded`)
    }

    // Prose.
    const text = speaker.comment.trim()
    assert.ok(text.length > 0 && text.length <= 1200, `${where}: ${speaker.name} comment length`)
    assert.equal(
      text.split(/\s+/).filter(Boolean).length,
      speaker.wordCount,
      `${where}: ${speaker.name} wordCount is wrong`,
    )
    allWordCounts.push(speaker.wordCount)
    assert.doesNotMatch(text, BANNED, `${where}: ${speaker.name} wrote like a product reviewer`)
    assert.ok(
      speaker.suggestedRating >= 2 && speaker.suggestedRating <= 5,
      `${where}: ${speaker.name} rating out of range`,
    )
    assert.ok(
      ['LOVED', 'CLAPPED', 'NEUTRAL'].includes(speaker.suggestedReactionType),
      `${where}: ${speaker.name} reaction type`,
    )

    // "Never paraphrase an archived line." Machine-enforced: no eight-word run
    // of a new comment may appear in any archived sample by this speaker.
    const shingles = (value: string): Set<string> => {
      const words = value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
      const out = new Set<string>()
      for (let start = 0; start + 8 <= words.length; start += 1) {
        out.add(words.slice(start, start + 8).join(' '))
      }
      return out
    }
    const fresh = shingles(text)
    for (const sample of evidence?.samples || []) {
      for (const shingle of shingles(sample.text)) {
        assert.ok(
          !fresh.has(shingle),
          `${where}: ${speaker.name} reuses an archived phrase — "${shingle}"`,
        )
      }
    }
  })
})

// Variation is part of the quality target: a batch of fifteen identical shapes
// would pass every check above and still be the wrong deliverable.
assert.ok((shapeTally.SOLO || 0) >= 1, 'the batch needs at least one SOLO')
assert.ok((shapeTally.DUET || 0) >= 1, 'the batch needs at least one DUET')
assert.ok((shapeTally.DUET_REPLY || 0) >= 1, 'the batch needs at least one reply exchange')
assert.ok((shapeTally.TRIO || 0) <= 2, 'TRIO stays rare')
assert.ok(
  exchanges.some((exchange) => exchange.target.type === 'REWARD') &&
    exchanges.some((exchange) => exchange.target.type === 'FACET'),
  'both target types must appear',
)

const distinctSpeakers = new Set(
  exchanges.flatMap((exchange) => exchange.speakers.map((speaker) => speakerKey(speaker))),
)
assert.ok(
  distinctSpeakers.size >= exchanges.length,
  'speaker concentration: fewer distinct speakers than exchanges',
)

const sorted = [...allWordCounts].sort((left, right) => left - right)
const median = sorted[Math.floor(sorted.length / 2)]!
assert.ok(
  sorted[sorted.length - 1]! - sorted[0]! >= 20,
  'deliberateRangeRequired: comment lengths are too uniform',
)
assert.ok(median >= 25 && median <= 60, `median comment length ${median} left the archive band`)

console.log(
  `Comment calibration contract passed — ${exchanges.length} exchanges, ` +
    `${distinctSpeakers.size} distinct speakers, median ${median} words.`,
)
