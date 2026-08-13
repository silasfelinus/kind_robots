// /utils/scripts/verifyPopulationDraftQuality.ts
//
// The publisher's prose rules, run over the population packets at commit time.
//
// WHY
// ---
// Same reason as verifyCommentDraftQuality.ts: the production publisher aborts
// on the FIRST violation, so a corpus with eight problems costs eight runs to
// discover. This reports all of them at once, offline, in about a second.
//
// Two rules are specific to this pass and do not exist in the facet lane:
//
//   1. On a VISIT_REPLY, slot 1 must be the TARGET speaking as itself. A packet
//      that puts anyone else there publishes one Bot's answer under another
//      Bot's name -- and nothing downstream would notice, because both are
//      valid first-party authors.
//
//   2. Freshness is checked against the #1769 corpus too, not just this one.
//      961 comments already shipped in these speakers' voices; a phrase reused
//      from those is just as stale as one reused from here.
//
//   npm run test:population-quality
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildVoiceEvidenceIndex,
  speakerKey,
  type ArchivedVoiceRecord,
} from './../../utils/comments/voiceEvidence'
import { characterVoiceSeeds } from './../../stores/seeds/characterVoices'
import {
  populationSelfSpeaker,
  populationShapeFor,
  populationSpeakerCount,
  POPULATION_TARGET_TYPES,
  type PopulationTargetType,
} from './../../utils/comments/populationTargets'

const BANNED_REVIEW_LANGUAGE =
  /\b(components?|wonderlabs?|museums?|exhibits?|star ratings?|ratings?|reviews?|implementations?|usability)\b/i

type DraftSpeaker = {
  kind: 'BOT' | 'CHARACTER'
  id: number
  name: string
  comment: string
}
type DraftItem = {
  key: string
  title?: string
  shape: string
  speakers: DraftSpeaker[]
}
type DraftPacket = { items: DraftItem[] }

const root = process.cwd()
const draftsDir = join(root, 'config', 'population-comment-drafts')

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

/** Every comment the #1769 corpus already published, keyed by speaker. */
function priorCorpusText(): Map<string, string[]> {
  const dir = join(root, 'config', 'comment-backfill-drafts')
  const map = new Map<string, string[]>()
  let names: string[]
  try {
    names = readdirSync(dir).filter((name) => /^batch-\d+\.json$/.test(name))
  } catch {
    return map
  }
  for (const name of names.sort()) {
    const packet = JSON.parse(
      readFileSync(join(dir, name), 'utf8'),
    ) as DraftPacket
    for (const item of packet.items) {
      for (const speaker of item.speakers) {
        const key = speakerKey(speaker)
        map.set(key, [...(map.get(key) || []), speaker.comment.trim()])
      }
    }
  }
  return map
}

/**
 * Every speaker resolved against production, by id and by name.
 *
 * This corpus had no such check and a production dry run found out why: the
 * packets cast BOT:339 "Link Analytica", and production has that bot at id 22.
 * The publisher aborts on the first unknown author, so a corpus with several
 * would have cost one production run apiece to discover.
 *
 * test:comment-authors already does this -- for the #1769 corpus only. The
 * lesson is that a pre-flight belongs to a corpus, not to a lane, and a second
 * corpus needs its own.
 */
async function liveSpeakers(): Promise<Map<string, string>> {
  const base = (
    process.argv
      .find((value) => value.startsWith('--base='))
      ?.slice('--base='.length) || 'https://kindrobots.org'
  ).replace(/\/+$/, '')
  const get = async <T,>(path: string): Promise<T> => {
    const response = await fetch(`${base}${path}`, {
      headers: { accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`)
    const body = (await response.json()) as { data?: T }
    return (body.data ?? (body as unknown)) as T
  }
  const [bots, characters] = await Promise.all([
    get<Array<{ id: number; name: string }>>('/api/bots?page=1&pageSize=500'),
    get<Array<{ id: number; name: string }>>('/api/characters'),
  ])
  const map = new Map<string, string>()
  for (const row of bots) map.set(`BOT:${row.id}`, row.name)
  for (const row of characters) map.set(`CHARACTER:${row.id}`, row.name)
  return map
}

const live = await liveSpeakers()

const voiceIndex = buildVoiceEvidenceIndex(loadArchive())
const canonicalById = new Map<number, string | null>(
  characterVoiceSeeds.map((seed) => [seed.id, seed.sampleResponse || null]),
)

type Violation = {
  batch: string
  item: string
  speaker: string
  problem: string
}
const violations: Violation[] = []

function flag(
  batch: string,
  item: DraftItem,
  speaker: string,
  problem: string,
) {
  violations.push({ batch, item: item.key, speaker, problem })
}

function parseKey(
  key: string,
): { type: PopulationTargetType; id: number } | null {
  const [rawType, rawId] = key.split(':')
  const type = POPULATION_TARGET_TYPES.find((entry) => entry === rawType)
  const id = Number(rawId)
  if (!type || !Number.isInteger(id) || id <= 0) return null
  return { type, id }
}

const batchNames = readdirSync(draftsDir)
  .filter((name) => /^batch-\d+\.json$/.test(name))
  .sort()
assert.ok(batchNames.length, `No draft packets found in ${draftsDir}.`)

// Seeded with the shipped corpus, then extended as this one is walked, so a
// phrase repeated across BOTH bodies of work is caught.
const authoredText = priorCorpusText()
let comments = 0
const seenKeys = new Set<string>()

for (const batch of batchNames) {
  const packet = JSON.parse(
    readFileSync(join(draftsDir, batch), 'utf8'),
  ) as DraftPacket

  for (const item of packet.items) {
    const parsed = parseKey(item.key)
    if (!parsed) {
      flag(batch, item, '-', `key "${item.key}" is not a population target`)
      continue
    }
    if (seenKeys.has(item.key)) {
      flag(batch, item, '-', 'target appears twice in the corpus')
    }
    seenKeys.add(item.key)

    const expectedShape = populationShapeFor(parsed.type)
    if (item.shape !== expectedShape) {
      flag(
        batch,
        item,
        '-',
        `${parsed.type} must be ${expectedShape}, packet says ${item.shape}`,
      )
    }

    const expected = populationSpeakerCount(expectedShape)
    if (item.speakers.length !== expected) {
      flag(
        batch,
        item,
        '-',
        `${expectedShape} needs ${expected} speaker(s), has ${item.speakers.length}`,
      )
    }

    // The reply slot is not a casting decision -- it is the object answering.
    const self = populationSelfSpeaker(parsed.type, parsed.id)
    if (self) {
      const reply = item.speakers[1]
      if (!reply) {
        flag(batch, item, '-', 'no reply speaker')
      } else if (speakerKey(reply) !== speakerKey(self)) {
        flag(
          batch,
          item,
          reply.name,
          `reply must be ${self.kind}:${self.id} answering for itself, got ${reply.kind}:${reply.id}`,
        )
      }
      const visitor = item.speakers[0]
      if (visitor && speakerKey(visitor) === speakerKey(self)) {
        flag(batch, item, visitor.name, 'is its own visitor')
      }
    }

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

      const liveName = live.get(key)
      if (!liveName) {
        flag(batch, item, speaker.name, `${key} does not exist in production`)
      } else if (liveName !== speaker.name) {
        flag(
          batch,
          item,
          speaker.name,
          `${key} is "${liveName}" in production`,
        )
      }

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
      const banned = value.match(BANNED_REVIEW_LANGUAGE)?.[0]
      if (banned) {
        flag(batch, item, speaker.name, `reviewer/museum language: "${banned}"`)
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
  const lengths: number[] = []
  for (const batch of batchNames) {
    const packet = JSON.parse(
      readFileSync(join(draftsDir, batch), 'utf8'),
    ) as DraftPacket
    for (const item of packet.items) {
      for (const speaker of item.speakers) {
        lengths.push(normalizeWords(speaker.comment).length)
      }
    }
  }
  lengths.sort((a, b) => a - b)
  console.log(
    `Population draft quality verified: ${scope}, ${seenKeys.size} target(s), median ${lengths[Math.floor(lengths.length / 2)]} words (${lengths[0]}-${lengths[lengths.length - 1]}).`,
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
