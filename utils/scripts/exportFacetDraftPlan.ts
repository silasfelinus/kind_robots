// /utils/scripts/exportFacetDraftPlan.ts
//
// The authoring input for the remaining comment corpus, without a database.
//
// WHY
// ---
// kind_robots#1769. `exportCommentBackfillPlans.ts` produces exactly this, and
// reaches the database to do it (`server/utils/prisma`), so it cannot run from a
// session that only has the public API. `commentCastingPreview.ts` proves the
// whole casting path works over HTTP; this is that path pointed at a range of
// the target list instead of a handful of ids, emitting everything needed to
// write the comments and nothing else.
//
// It reproduces the publisher's eligible-target list exactly — Rewards by id,
// then Facets by id, same filters — because the payload is matched to targets
// BY POSITION at publish time. An index here that disagrees with the publisher's
// index would attach every later comment to the wrong object.
//
//   npx tsx utils/scripts/exportFacetDraftPlan.ts --from 256 --count 24
//   npx tsx utils/scripts/exportFacetDraftPlan.ts --from 259 --count 24 --json plan.json
//
// Novelty is seeded from the committed corpus, so a speaker already carrying
// sixteen comments is not handed a seventeenth while ninety-five speakers have
// never said anything.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { rankCommentSpeakers } from './../../utils/comments/commentCasting'
import { withFacetAttributes } from './../../utils/comments/facetAttributeMatch'
import {
  scoreSpeakerPool,
  type SignalSpeakerProfile,
  type SignalTargetProfile,
} from './../../utils/comments/commentSignals'
import {
  buildVoiceEvidenceIndex,
  selectVoiceSamples,
  speakerKey,
  voiceEvidenceTier,
  type ArchivedVoiceRecord,
} from './../../utils/comments/voiceEvidence'
import { characterVoiceSeeds } from './../../stores/seeds/characterVoices'

type Row = Record<string, unknown>

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`)
  const value = process.argv[index + 1]
  return index > -1 && value ? value : fallback
}

const baseUrl = arg('base', 'https://kindrobots.org').replace(/\/+$/, '')
const from = Number(arg('from', '256'))
const count = Number(arg('count', '24'))
const jsonOut = arg('json', '')
const root = process.cwd()

const text = (value: unknown): string => String(value ?? '').trim()

async function getRows(path: string): Promise<Row[]> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`)
  const body = (await response.json()) as Row[] | { data?: Row[] }
  return Array.isArray(body) ? body : body.data || []
}

async function getAllFacets(): Promise<Row[]> {
  const all: Row[] = []
  for (let skip = 0; skip < 5000; skip += 250) {
    const page = await getRows(`/api/facets?take=250&skip=${skip}`)
    all.push(...page)
    if (page.length < 250) break
  }
  return all
}

/**
 * Deliberately the same shape as loadEligibleTargets() in the publisher:
 * Rewards by id, then Facets by id, filtered the same way. Position is the
 * contract between this file and the production write.
 */
async function loadEligibleTargets() {
  const [rewards, facets] = await Promise.all([getRows('/api/rewards'), getAllFacets()])

  const live = (row: Row) =>
    row.isPublic === true && row.isActive === true && row.allowReviews !== false

  const rewardTargets = rewards
    .filter(live)
    .sort((left, right) => Number(left.id) - Number(right.id))
    .map((row) => ({ type: 'REWARD' as const, row }))

  const facetTargets = facets
    .filter(live)
    .filter(
      (row) => text(row.description) || text(row.flavorText) || text(row.examples),
    )
    .sort((left, right) => Number(left.id) - Number(right.id))
    .map((row) => ({ type: 'FACET' as const, row }))

  return [...rewardTargets, ...facetTargets]
}

/**
 * The planner's rule, restated (server/utils/commentBackfillGeneration.ts).
 * Shape is a function of the global index, not a free choice, so a packet
 * written by hand still matches what the planner would have produced.
 */
function shapeFor(type: 'REWARD' | 'FACET', index: number) {
  if (type === 'FACET') {
    if (index % 17 === 0) return { shape: 'DUET' as const, speakerCount: 2 }
    if (index % 9 === 0) return { shape: 'DUET_REPLY' as const, speakerCount: 2 }
    return { shape: 'SOLO' as const, speakerCount: 1 }
  }
  if (index % 19 === 0) return { shape: 'TRIO' as const, speakerCount: 3 }
  if (index % 7 === 0) return { shape: 'SOLO' as const, speakerCount: 1 }
  if (index % 3 === 0) return { shape: 'DUET_REPLY' as const, speakerCount: 2 }
  return { shape: 'DUET' as const, speakerCount: 2 }
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

/** How often each speaker already appears in the committed corpus. */
function priorCastCounts(): Map<string, number> {
  const draftsDir = join(root, 'config', 'comment-backfill-drafts')
  const counts = new Map<string, number>()
  for (const name of readdirSync(draftsDir).filter((file) =>
    /^batch-\d+\.json$/.test(file),
  )) {
    const packet = JSON.parse(readFileSync(join(draftsDir, name), 'utf8')) as {
      items: Array<{ speakers: Array<{ kind: 'BOT' | 'CHARACTER'; id: number }> }>
    }
    for (const item of packet.items) {
      for (const speaker of item.speakers) {
        const key = speakerKey(speaker)
        counts.set(key, (counts.get(key) || 0) + 1)
      }
    }
  }
  return counts
}

function characterProfile(row: Row): SignalSpeakerProfile {
  return {
    kind: 'CHARACTER',
    id: Number(row.id),
    name: String(row.name),
    personality: text(row.personality) || null,
    voice: text(row.voice) || null,
    sampleResponse: text(row.sampleResponse) || null,
    quirks: text(row.quirks) || null,
    drive: text(row.drive) || null,
    backstory: text(row.backstory) || null,
    role: text(row.role) || null,
    title: text(row.title) || null,
    alignment: text(row.alignment) || null,
    characterClass: text(row.class) || null,
    species: text(row.species) || null,
    genre: text(row.genre) || null,
  }
}

function botProfile(row: Row): SignalSpeakerProfile {
  return {
    kind: 'BOT',
    id: Number(row.id),
    name: String(row.name),
    personality: text(row.personality) || null,
    botIntro: text(row.botIntro) || null,
    narrativeVoice: text(row.narrativeVoice) || null,
    sampleResponse: text(row.sampleResponse) || null,
    tagline: text(row.tagline) || null,
    subtitle: text(row.subtitle) || null,
    description: text(row.description) || null,
    botType: text(row.BotType) || null,
  }
}

async function main() {
  const [targets, characters, bots, catalog] = await Promise.all([
    loadEligibleTargets(),
    getRows('/api/characters'),
    getRows('/api/bots?page=1&pageSize=200'),
    getAllFacets(),
  ])

  if (from < 0 || from >= targets.length) {
    throw new Error(`--from ${from} is outside the eligible range 0..${targets.length - 1}.`)
  }

  const pool = withFacetAttributes(
    [...characters.map(characterProfile), ...bots.map(botProfile)],
    catalog.map((row) => ({
      id: Number(row.id),
      title: text(row.title) || null,
      groupKey: text(row.groupKey) || null,
      groupLabel: text(row.groupLabel) || null,
      aliases: (row.aliases as string[] | string | null) ?? null,
    })),
  )

  const evidence = buildVoiceEvidenceIndex(loadArchive())
  const castCounts = priorCastCounts()
  // Explicitly keyed on number: characterVoiceSeeds infers literal id types, so
  // an inferred Map keys on a union of ~210 literals and rejects a plain number.
  const seedById = new Map<number, (typeof characterVoiceSeeds)[number]>(
    characterVoiceSeeds.map((seed) => [seed.id, seed]),
  )

  const slice = targets.slice(from, from + count)
  const plan = []

  for (const [offset, target] of slice.entries()) {
    const index = from + offset
    const { shape, speakerCount } = shapeFor(target.type, index)
    const row = target.row

    const profile: SignalTargetProfile =
      target.type === 'REWARD'
        ? {
            type: 'REWARD',
            id: Number(row.id),
            title: text(row.name),
            description: text(row.description) || null,
            flavorText: text(row.flavorText) || null,
            category: [text(row.rarity), text(row.rewardType)].filter(Boolean).join(' '),
            linkedCharacterIds: ((row.Characters as Row[]) || []).map((c) => Number(c.id)),
          }
        : {
            type: 'FACET',
            id: Number(row.id),
            title: text(row.title),
            description: text(row.description) || null,
            flavorText: text(row.flavorText) || null,
            category: text(row.groupLabel) || text(row.groupKey),
          }

    // rankCommentSpeakers applies the weights and reasons to candidates that
    // ALREADY carry their four signals; scoreSpeakerPool is what computes them
    // (and drops anyone with no recoverable voice). Skipping it hands rank a
    // pool of zeroes, which sorts as "pool order" and casts the same two
    // speakers on every target.
    const scored = scoreSpeakerPool(profile, pool, { evidence, castCounts })
    const cast = rankCommentSpeakers(profile, scored, speakerCount)
    for (const speaker of cast) {
      const key = speakerKey(speaker)
      castCounts.set(key, (castCounts.get(key) || 0) + 1)
    }

    plan.push({
      index,
      key: `${target.type}:${row.id}`,
      title: profile.title,
      type: target.type,
      shape,
      category: profile.category,
      description: profile.description,
      flavorText: profile.flavorText,
      examples: target.type === 'FACET' ? text(row.examples) || null : null,
      speakers: cast.map((speaker) => {
        const key = speakerKey(speaker)
        const source = pool.find((entry) => speakerKey(entry) === key)!
        const seed = speaker.kind === 'CHARACTER' ? seedById.get(speaker.id) : undefined
        return {
          kind: speaker.kind,
          id: speaker.id,
          name: speaker.name,
          score: speaker.score,
          reasons: speaker.reasons,
          voiceTier: voiceEvidenceTier(evidence.get(key)),
          priorComments: (castCounts.get(key) || 1) - 1,
          voice: seed?.voice || source.voice || source.narrativeVoice || null,
          // The freshness rules compare against these. Anything reusing an
          // 8-word run from any of them is rejected by the publisher.
          canonicalSample: seed?.sampleResponse || source.sampleResponse || null,
          archiveSamples: selectVoiceSamples(evidence.get(key), 3).map((s) => s.text),
        }
      }),
    })
  }

  if (jsonOut) {
    // resolve, not join: an absolute --json path must not be glued onto root.
    writeFileSync(resolve(root, jsonOut), `${JSON.stringify(plan, null, 2)}\n`, 'utf8')
    console.log(`Wrote ${plan.length} planned target(s) to ${jsonOut}.`)
    return
  }

  for (const entry of plan) {
    console.log('='.repeat(70))
    console.log(`[${entry.index}] ${entry.key} — ${entry.title}   (${entry.shape})`)
    if (entry.category) console.log(`  ${entry.category}`)
    if (entry.description) console.log(`  ${entry.description}`)
    if (entry.flavorText) console.log(`  flavor: ${entry.flavorText}`)
    if (entry.examples) console.log(`  examples: ${entry.examples}`)
    for (const speaker of entry.speakers) {
      console.log(
        `\n  ${speaker.name} (${speaker.kind}:${speaker.id})  score ${speaker.score.toFixed(1)}  voice ${speaker.voiceTier}  prior ${speaker.priorComments}`,
      )
      console.log(`    ${speaker.reasons.join(' | ')}`)
      if (speaker.voice) console.log(`    voice: ${speaker.voice.replace(/\s+/g, ' ').slice(0, 220)}`)
      if (speaker.canonicalSample) {
        console.log(`    canonical: ${speaker.canonicalSample.replace(/\s+/g, ' ').slice(0, 200)}`)
      }
      for (const sample of speaker.archiveSamples) {
        console.log(`    archive: ${sample.replace(/\s+/g, ' ').slice(0, 200)}`)
      }
    }
    console.log('')
  }
  console.log(`${plan.length} target(s), indices ${from}..${from + plan.length - 1}.`)
}

await main()
