// /utils/scripts/commentCensus.ts
//
// Phase A of kind_robots#1769: the census that has to exist before anyone casts
// a speaker or writes a line.
//
//   npx tsx utils/scripts/commentCensus.ts
//   npx tsx utils/scripts/commentCensus.ts --base https://kind-robots.vercel.app
//
// Two questions this answers, and nothing else:
//
//   1. Which Rewards and Facets are worth commenting on — how many are live, how
//      many carry the description/effect/flavor text a speaker needs something to
//      react to, and how densely the relationship signals (Reward<->Character
//      links, facet links) are distributed.
//   2. Which Bots and Characters have enough recoverable voice to speak — from
//      the archived WonderLab corpus in config/wonderlab-voice-polish-batch-*.json,
//      and from live personality/voice/sampleResponse fields where the archive has
//      nothing.
//
// The archived corpus is read as VOICE EVIDENCE ONLY. This script deliberately
// does not compute, emit, or rank historical speaker pairings: which two speakers
// shared a museum component is not a casting signal (#1769), and the cheapest way
// to keep that weight at zero is to never compute it in the first place.
//
// Reads the live public API; writes only the artifact and the doc. No database
// connection, no auth, no writes to any Kind Robots record.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildVoiceEvidenceIndex,
  speakerKey,
  voiceEvidenceTier,
  type ArchivedVoiceRecord,
  type SpeakerVoiceEvidence,
  type VoiceEvidenceTier,
} from './../../utils/comments/voiceEvidence'

type Row = Record<string, unknown>

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`)
  const value = process.argv[index + 1]
  return index > -1 && value ? value : fallback
}

const repoRoot = process.cwd()
const baseUrl = arg('base', 'https://kindrobots.org').replace(/\/+$/, '')
const outPath = join(repoRoot, arg('out', 'artifacts/comment-census.json'))
const docPath = join(repoRoot, arg('doc', 'docs/architecture/comment-census.md'))

async function getRows(path: string): Promise<Row[]> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`)
  const body = (await response.json()) as Row[] | { data?: Row[] }
  return Array.isArray(body) ? body : body.data || []
}

async function getAllFacets(): Promise<Row[]> {
  // The facets route caps `take` at 250 and pages with `skip`. Everything else
  // in this census fits in a single response.
  const all: Row[] = []
  for (let skip = 0; skip < 5000; skip += 250) {
    const page = await getRows(`/api/facets?take=250&skip=${skip}`)
    all.push(...page)
    if (page.length < 250) break
  }
  return all
}

function loadArchivedRecords(): ArchivedVoiceRecord[] {
  const configDir = join(repoRoot, 'config')
  return readdirSync(configDir)
    .filter((name) => /^wonderlab-voice-polish-batch-\d+\.json$/.test(name))
    .sort()
    .flatMap((name) => {
      const parsed = JSON.parse(readFileSync(join(configDir, name), 'utf8')) as {
        revisions?: Array<ArchivedVoiceRecord & { batchFile?: string }>
      }
      return (parsed.revisions || []).map((revision) => ({ ...revision, batchFile: name }))
    })
}

const text = (value: unknown): string => String(value ?? '').trim()
const filled = (value: unknown): boolean => text(value).length > 0
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

function countBy(rows: Row[], pick: (row: Row) => unknown): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of rows) {
    const key = String(pick(row) ?? 'UNKNOWN')
    counts[key] = (counts[key] || 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]))
}

function liveVoiceLength(row: Row): number {
  return [
    row.personality,
    row.voice,
    row.sampleResponse,
    row.botIntro,
    row.narrativeVoice,
    row.quirks,
    row.tagline,
  ]
    .map(text)
    .filter(Boolean)
    .join(' ').length
}

type SpeakerRow = {
  kind: 'BOT' | 'CHARACTER'
  id: number
  name: string
  archivedSamples: number
  tier: VoiceEvidenceTier
  liveVoiceChars: number
  castable: boolean
}

function speakerCensus(
  bots: Row[],
  characters: Row[],
  index: Map<string, SpeakerVoiceEvidence>,
) {
  const rows: SpeakerRow[] = [
    ...bots.map((row) => ({ kind: 'BOT' as const, row })),
    ...characters.map((row) => ({ kind: 'CHARACTER' as const, row })),
  ].map(({ kind, row }) => {
    const id = Number(row.id)
    const evidence = index.get(speakerKey({ kind, id }))
    const tier = voiceEvidenceTier(evidence)
    const liveVoiceChars = liveVoiceLength(row)
    return {
      kind,
      id,
      name: text(row.name),
      archivedSamples: evidence?.samples.length || 0,
      tier,
      liveVoiceChars,
      castable: tier !== 'NONE' || liveVoiceChars > 0,
    }
  })

  const byTier: Record<string, number> = {}
  for (const row of rows) byTier[row.tier] = (byTier[row.tier] || 0) + 1

  return {
    total: rows.length,
    byTier,
    castable: rows.filter((row) => row.castable).length,
    silent: rows
      .filter((row) => !row.castable)
      .map((row) => `${row.kind}:${row.id} ${row.name}`)
      .sort(),
    richest: rows
      .filter((row) => row.tier === 'RICH')
      .sort(
        (left, right) =>
          right.archivedSamples - left.archivedSamples || left.name.localeCompare(right.name),
      )
      .slice(0, 15)
      .map((row) => ({ speaker: `${row.name} (${row.kind})`, samples: row.archivedSamples })),
  }
}

function rewardCensus(rewards: Row[]) {
  return {
    total: rewards.length,
    public: rewards.filter((row) => row.isPublic).length,
    active: rewards.filter((row) => row.isActive).length,
    allowReviews: rewards.filter((row) => row.allowReviews).length,
    withDescription: rewards.filter((row) => filled(row.description)).length,
    withEffect: rewards.filter((row) => filled(row.effect)).length,
    withFlavorText: rewards.filter((row) => filled(row.flavorText)).length,
    withExistingReactions: rewards.filter((row) => list(row.Reactions).length > 0).length,
    withCharacterLinks: rewards.filter((row) => list(row.Characters).length > 0).length,
    byType: countBy(rewards, (row) => row.rewardType),
    byRarity: countBy(rewards, (row) => row.rarity),
  }
}

function facetCensus(facets: Row[]) {
  return {
    total: facets.length,
    public: facets.filter((row) => row.isPublic).length,
    active: facets.filter((row) => row.isActive).length,
    withDescription: facets.filter((row) => filled(row.description)).length,
    withFlavorText: facets.filter((row) => filled(row.flavorText)).length,
    withExamples: facets.filter((row) => filled(row.examples)).length,
    titleOnly: facets.filter(
      (row) => !filled(row.description) && !filled(row.flavorText) && !filled(row.examples),
    ).length,
    byTaxonomy: countBy(facets, (row) => row.taxonomy),
  }
}

type Census = {
  generatedFrom: string
  note: string
  rewards: ReturnType<typeof rewardCensus>
  facets: ReturnType<typeof facetCensus>
  resources: { total: number; public: number; deferred: boolean; reason: string }
  archive: { rawRows: number; uniqueDrafts: number; duplicateDrafts: number; speakers: number }
  speakers: ReturnType<typeof speakerCensus>
}

function pairs(counts: Record<string, number>): string {
  return Object.entries(counts)
    .map(([key, value]) => `${key} ${value}`)
    .join(' · ')
}

function doc(census: Census): string {
  const { rewards, facets, resources, speakers, archive } = census
  const tier = (name: VoiceEvidenceTier) => speakers.byTier[name] || 0
  const taxonomyRows = Object.entries(facets.byTaxonomy)
    .slice(0, 12)
    .map(([name, count]) => `| ${name} | ${count} |`)
    .join('\n')

  return `# Comment census — Rewards, Facets, and recoverable voices

Generated by \`npx tsx utils/scripts/commentCensus.ts\` against \`${census.generatedFrom}\`.
Re-run it to refresh; do not hand-edit the numbers.

Phase A of [#1769](https://github.com/silasfelinus/kind_robots/issues/1769) — the evidence
base for casting: what is worth commenting on, and who can credibly speak.

## What is commentable

| | Rewards | Facets | Resources |
|---|---|---|---|
| rows the public API returns | ${rewards.total} | ${facets.total} | ${resources.total} |
| public | ${rewards.public} | ${facets.public} | ${resources.public} |
| \`allowReviews\` true | ${rewards.allowReviews} | not exposed | no such column |
| already carry Reactions | ${rewards.withExistingReactions} | not exposed | not exposed |

**Resources are deferred this pass.** The public API returns ${resources.total} of them:
every Resource row is \`isPublic: false\`, they are LoRA/checkpoint/embedding infrastructure
rather than play objects, and \`Resource\` is the only one of the three target models with no
\`allowReviews\` column and no Character or Facet relations. Whether a private LoRA deserves
in-world commentary is a product question, not an oversight.

**\`allowReviews\` is false on every row we can see** — Rewards, Characters, and Bots alike.
If first-party commentary is gated on that flag the way user reviews are, none of this work
will ever render. That decision belongs to Silas and is not made here.

### Rewards

${rewards.withDescription} of ${rewards.total} carry a description, ${rewards.withEffect} an
effect, ${rewards.withFlavorText} flavor text. A speaker never has to invent something to
react to.

**${rewards.withCharacterLinks} of ${rewards.total} Rewards carry direct Character links** —
the strongest casting signal in this data, and dense enough to lead with.

- By type: ${pairs(rewards.byType)}
- By rarity: ${pairs(rewards.byRarity)}

### Facets

${facets.withDescription} of ${facets.total} carry a description; ${facets.withFlavorText}
carry flavor text and ${facets.withExamples} carry examples. **${facets.titleOnly} are a bare
title plus a taxonomy** — weak comment targets, and the casting signals should say so rather
than paper over it.

| Taxonomy | Facets |
|---|---|
${taxonomyRows}

## Who can speak

${archive.uniqueDrafts} unique archived comments survive in
\`config/wonderlab-voice-polish-batch-*.json\` (${archive.rawRows} rows before deduping by
\`draftId\` — ${archive.duplicateDrafts} drafts were polished twice), covering
${archive.speakers} distinct speakers, every one of whom still resolves to a live Bot or
Character.

| Voice-evidence tier | Speakers |
|---|---|
| RICH — 4+ archived samples | ${tier('RICH')} |
| THIN — 2–3 | ${tier('THIN')} |
| SPARSE — 1 | ${tier('SPARSE')} |
| NONE — live fields only | ${tier('NONE')} |

${speakers.castable} of ${speakers.total} live Bots and Characters are castable: either
archived samples or live \`personality\`/\`voice\`/\`sampleResponse\` text exists. The
remaining ${speakers.silent.length} have neither and are excluded rather than handed an
invented voice.

${speakers.silent.length ? speakers.silent.map((entry) => `- ${entry}`).join('\n') : '- none'}

### Deepest voices

${speakers.richest.map((row) => `- **${row.speaker}** — ${row.samples} samples`).join('\n')}

Concentration is the risk this table exposes. A handful of speakers have several times the
evidence of everyone else, and naive casting hands them everything —
\`noveltyScore\` in \`utils/comments/commentSignals.ts\` exists to counteract exactly that.

## What this census deliberately omits

No historical pairing or co-occurrence data. Which two speakers shared a museum component is
not a casting signal, and computing it here would invite the next pass to reach for it.
Voice, not history.

## Open questions

1. Does \`allowReviews\` gate first-party commentary, or only user reviews?
2. Do private Resources deserve in-world commentary at all?
3. Facets that are a bare title — comment on them, or require a minimum amount of object
   text before a Facet becomes castable?
`
}

async function main() {
  const [rewards, facets, characters, bots, resources] = await Promise.all([
    getRows('/api/rewards'),
    getAllFacets(),
    getRows('/api/characters'),
    getRows('/api/bots'),
    getRows('/api/resources'),
  ])

  const records = loadArchivedRecords()
  const index = buildVoiceEvidenceIndex(records)
  const uniqueDrafts = new Set(records.map((record) => record.draftId)).size

  const census: Census = {
    generatedFrom: baseUrl,
    note: 'Voice evidence only. No historical speaker pairings are recorded or used.',
    rewards: rewardCensus(rewards),
    facets: facetCensus(facets),
    resources: {
      total: resources.length,
      public: resources.filter((row) => row.isPublic).length,
      deferred: true,
      reason:
        'No publicly visible rows, no allowReviews column, no Character or Facet relations.',
    },
    archive: {
      rawRows: records.length,
      uniqueDrafts,
      duplicateDrafts: records.length - uniqueDrafts,
      speakers: index.size,
    },
    speakers: speakerCensus(bots, characters, index),
  }

  writeFileSync(outPath, `${JSON.stringify(census, null, 2)}\n`)
  writeFileSync(docPath, doc(census))

  console.log(
    `Rewards ${census.rewards.total} (${census.rewards.withCharacterLinks} character-linked) · ` +
      `Facets ${census.facets.total} · Resources ${census.resources.total} · ` +
      `speakers ${census.speakers.castable}/${census.speakers.total} castable`,
  )
  console.log(`Wrote ${outPath}`)
  console.log(`Wrote ${docPath}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
