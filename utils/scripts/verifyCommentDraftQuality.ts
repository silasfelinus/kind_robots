// /utils/scripts/verifyCommentDraftQuality.ts
//
// Every drafted comment would survive the publisher, checked before it is
// committed rather than twenty minutes into a production run.
//
// WHY
// ---
// kind_robots#1769. `publishCommentBackfillLiveBatches.ts` runs a set of prose
// rules over every comment — length, banned vocabulary, and a freshness check
// that refuses any 8-word run the speaker has already used — and, like its
// author-name check, it throws on the FIRST violation. That is right for a
// production write and useless as an authoring loop: the corpus is 470 comments
// short of complete, and finding one violation per Tailscale-gated run is not a
// way to write them.
//
// Everything those rules compare against is already in the repo. The archived
// voice corpus is 39 committed JSON files; the canonical sample responses are in
// stores/seeds/characterVoices.ts; the drafts are the batch files themselves.
// The only thing the publisher has that this does not is comments already in the
// database, and there are none — nothing has ever been published. So this can
// run offline, over the whole corpus, in a second, and report everything at once.
//
// It deliberately mirrors the publisher rather than inventing a house style: if
// the two disagree, this one is wrong.
//
//   npm run test:comment-quality
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildVoiceEvidenceIndex,
  speakerKey,
  type ArchivedVoiceRecord,
} from './../../utils/comments/voiceEvidence'
import { characterVoiceSeeds } from './../../stores/seeds/characterVoices'

// Kept byte-identical to BANNED_REVIEW_LANGUAGE in the publisher. These speakers
// are reacting to an object in character, not filing a review of it, and the
// museum vocabulary is a specific hangover from WonderLab.
const BANNED_REVIEW_LANGUAGE =
  /\b(component|wonderlab|museum|exhibit|star rating|rating|review|implementation|usability)\b/i

const SPEAKERS_PER_SHAPE: Record<string, number> = {
  SOLO: 1,
  DUET: 2,
  DUET_REPLY: 2,
  TRIO: 3,
}

type DraftSpeaker = { kind: 'BOT' | 'CHARACTER'; id: number; name: string; comment: string }
type DraftItem = { key: string; title?: string; shape: string; speakers: DraftSpeaker[] }
type DraftPacket = { items: DraftItem[] }

const root = process.cwd()
const draftsDir = join(root, 'config', 'comment-backfill-drafts')

function normalizeWords(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function shingles(value: string, size = 8): Set<string> {
  const words = normalizeWords(value)
  const result = new Set<string>()
  for (let index = 0; index + size <= words.length; index += 1) {
    result.add(words.slice(index, index + size).join(' '))
  }
  return result
}

function sharedShingle(left: string, right: string): string | null {
  const leftSet = shingles(left)
  for (const candidate of shingles(right)) {
    if (leftSet.has(candidate)) return candidate
  }
  return null
}

function loadArchive(): ArchivedVoiceRecord[] {
  const configDir = join(root, 'config')
  return readdirSync(configDir)
    .filter((name) => /^wonderlab-voice-polish-batch-\d+\.json$/.test(name))
    .sort()
    .flatMap((name) => {
      const parsed = JSON.parse(readFileSync(join(configDir, name), 'utf8')) as {
        revisions?: ArchivedVoiceRecord[]
      }
      return parsed.revisions || []
    })
}

const voiceIndex = buildVoiceEvidenceIndex(loadArchive())

// Seed-preferred, exactly as the publisher resolves it: characterVoiceSeeds
// overrides the live row, so a comment that echoes the seed sample is a reuse
// even when the database says something else.
// Explicitly Map<number, ...>: characterVoiceSeeds infers literal id types, so
// an inferred Map keys on a union of ~210 literals and rejects a plain number.
const canonicalById = new Map<number, string | null>(
  characterVoiceSeeds.map((seed) => [seed.id, seed.sampleResponse || null]),
)

type Violation = { batch: string; item: string; speaker: string; problem: string }
const violations: Violation[] = []

function flag(batch: string, item: DraftItem, speaker: string, problem: string) {
  violations.push({ batch, item: item.key, speaker, problem })
}

const batchNames = readdirSync(draftsDir)
  .filter((name) => /^batch-\d+\.json$/.test(name))
  .sort()
assert.ok(batchNames.length, `No draft packets found in ${draftsDir}.`)

// Comments already written by this speaker, anywhere in the corpus. The
// publisher accumulates this as it walks; so does this, in the same order, so a
// repeat is attributed to the second occurrence rather than the first.
const authoredText = new Map<string, string[]>()
let comments = 0

for (const batch of batchNames) {
  const packet = JSON.parse(
    readFileSync(join(draftsDir, batch), 'utf8'),
  ) as DraftPacket

  for (const item of packet.items) {
    const expected = SPEAKERS_PER_SHAPE[item.shape]
    if (expected === undefined) {
      flag(batch, item, '-', `unknown shape ${item.shape}`)
    } else if (item.speakers.length !== expected) {
      flag(
        batch,
        item,
        '-',
        `${item.shape} needs ${expected} speaker(s), has ${item.speakers.length}`,
      )
    }

    // A duet with one person in it is a monologue interrupted by itself.
    const seen = new Set<string>()
    for (const speaker of item.speakers) {
      const key = speakerKey(speaker)
      if (seen.has(key)) {
        flag(batch, item, speaker.name, 'speaks twice in the same exchange')
      }
      seen.add(key)
    }

    for (const speaker of item.speakers) {
      comments += 1
      const value = speaker.comment.trim()
      const words = normalizeWords(value)
      const key = speakerKey(speaker)

      if (value.length < 2 || value.length > 1200) {
        flag(batch, item, speaker.name, `comment is ${value.length} characters`)
        continue
      }
      if (words.length < 4 || words.length > 120) {
        flag(
          batch,
          item,
          speaker.name,
          `${words.length} words is outside the 4-120 guardrail`,
        )
      }
      const banned = value.match(BANNED_REVIEW_LANGUAGE)
      if (banned) {
        flag(
          batch,
          item,
          speaker.name,
          `reviewer/museum language: "${banned[0]}"`,
        )
      }

      for (const sample of voiceIndex.get(key)?.samples || []) {
        const overlap = sharedShingle(value, sample.text)
        if (overlap) {
          flag(batch, item, speaker.name, `reuses archived phrase "${overlap}"`)
          break
        }
      }

      const canonical =
        speaker.kind === 'CHARACTER' ? canonicalById.get(speaker.id) : null
      if (canonical) {
        const overlap = sharedShingle(value, canonical)
        if (overlap) {
          flag(batch, item, speaker.name, `reuses canonical phrase "${overlap}"`)
        }
      }

      for (const prior of authoredText.get(key) || []) {
        const overlap = sharedShingle(value, prior)
        if (overlap) {
          flag(batch, item, speaker.name, `repeats own phrase "${overlap}"`)
          break
        }
      }
      authoredText.set(key, [...(authoredText.get(key) || []), value])
    }
  }
}

const scope = `${comments} comment(s) across ${batchNames.length} batch file(s)`

if (!violations.length) {
  const lengths = [...authoredText.values()].flat().map((v) => normalizeWords(v).length)
  lengths.sort((a, b) => a - b)
  console.log(
    `Comment draft quality verified: ${scope}, median ${lengths[Math.floor(lengths.length / 2)]} words (${lengths[0]}-${lengths[lengths.length - 1]}).`,
  )
} else {
  console.error(`\n${violations.length} problem(s) in ${scope}:\n`)
  for (const violation of violations) {
    console.error(`  ${violation.batch} ${violation.item} — ${violation.speaker}`)
    console.error(`    ${violation.problem}`)
  }
  console.error(
    '\nEvery one of these would abort the production run, one per run, in this order.\n',
  )
  process.exitCode = 1
}
