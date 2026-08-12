// /utils/scripts/commentCastingPreview.ts
//
// Show, for real Rewards and Facets, who the casting signals put in front of
// them and why — the "inspectable enough that we can understand why a speaker
// was selected" requirement from kind_robots#1769.
//
//   npx tsx utils/scripts/commentCastingPreview.ts --rewards 276,441
//   npx tsx utils/scripts/commentCastingPreview.ts --facets 290,1219 --top 8
//   npx tsx utils/scripts/commentCastingPreview.ts --rewards 276 --samples
//   npx tsx utils/scripts/commentCastingPreview.ts --rewards 276,441 --json out.json
//
// Read-only against the public API. Generates no prose, calls no model, writes
// nothing unless --json is passed. It reports the four signals, their weighted
// total, and the reasons `rankCommentSpeakers` attached, so a casting choice can
// be argued with rather than taken on faith.
//
// `--samples` also prints the archived voice evidence for the cast speakers.
// That evidence is characterization only: it shows how a speaker sounds, never
// what they should say, and never implies that two speakers who happen to appear
// in the same archive belong together.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { rankCommentSpeakers } from './../../utils/comments/commentCasting'
import {
  scoreSpeakerPool,
  type CastingContext,
  type SignalSpeakerProfile,
  type SignalTargetProfile,
  type SpeakerSignals,
} from './../../utils/comments/commentSignals'
import {
  buildVoiceEvidenceIndex,
  selectVoiceSamples,
  speakerKey,
  voiceEvidenceTier,
  type ArchivedVoiceRecord,
} from './../../utils/comments/voiceEvidence'

type Row = Record<string, unknown>

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index > -1 ? process.argv[index + 1] : undefined
}

function idList(name: string): number[] {
  return (arg(name) || '')
    .split(',')
    .map((entry) => Number(entry.trim()))
    .filter((id) => Number.isInteger(id) && id > 0)
}

const baseUrl = (arg('base') || 'https://kindrobots.org').replace(/\/+$/, '')
const top = Number(arg('top') || 6)
const showSamples = process.argv.includes('--samples')
const jsonOut = arg('json')

const WEIGHTS = { relationship: 0.4, affinity: 0.35, voice: 0.2, novelty: 0.05 }

function weightedTotal(signals: SpeakerSignals): number {
  return (
    signals.relationshipScore * WEIGHTS.relationship +
    signals.targetAffinityScore * WEIGHTS.affinity +
    signals.voiceEvidenceScore * WEIGHTS.voice +
    signals.noveltyScore * WEIGHTS.novelty
  )
}

async function request(path: string): Promise<unknown> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, { headers: { accept: 'application/json' } })
    if (response.ok) return response.json()
    if (attempt === 3) throw new Error(`GET ${path} failed: ${response.status}`)
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500))
  }
  return null
}

async function getRows(path: string): Promise<Row[]> {
  const body = (await request(path)) as Row[] | { data?: Row[] }
  return Array.isArray(body) ? body : (body as { data?: Row[] }).data || []
}

async function getRow(path: string): Promise<Row | null> {
  const body = (await request(path)) as { data?: Row }
  return body?.data && !Array.isArray(body.data) ? body.data : null
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

const text = (value: unknown): string | null => {
  const trimmed = String(value ?? '').trim()
  return trimmed || null
}

function loadArchive(): ArchivedVoiceRecord[] {
  const configDir = join(process.cwd(), 'config')
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

function characterProfile(row: Row): SignalSpeakerProfile {
  return {
    kind: 'CHARACTER',
    id: Number(row.id),
    name: String(row.name),
    personality: text(row.personality),
    voice: text(row.voice),
    sampleResponse: text(row.sampleResponse),
    quirks: text(row.quirks),
    drive: text(row.drive),
    backstory: text(row.backstory),
    role: text(row.role),
    title: text(row.title),
    alignment: text(row.alignment),
    characterClass: text(row.class),
    species: text(row.species),
    genre: text(row.genre),
  }
}

function botProfile(row: Row): SignalSpeakerProfile {
  return {
    kind: 'BOT',
    id: Number(row.id),
    name: String(row.name),
    personality: text(row.personality),
    botIntro: text(row.botIntro),
    narrativeVoice: text(row.narrativeVoice),
    sampleResponse: text(row.sampleResponse),
    tagline: text(row.tagline),
    subtitle: text(row.subtitle),
    description: text(row.description),
    botType: text(row.BotType),
  }
}

function rewardTarget(row: Row, facetIds: number[]): SignalTargetProfile {
  return {
    type: 'REWARD',
    id: Number(row.id),
    title: String(row.name),
    description: text(row.description),
    flavorText: text(row.flavorText),
    effect: text(row.effect),
    category: [row.rewardType, row.rarity, row.collection].filter(Boolean).join(' '),
    facetIds,
    linkedCharacterIds: (Array.isArray(row.Characters) ? row.Characters : []).map((entry) =>
      Number((entry as Row).id),
    ),
  }
}

function facetTarget(row: Row): SignalTargetProfile {
  return {
    type: 'FACET',
    id: Number(row.id),
    title: String(row.title),
    description: text(row.description),
    flavorText: text(row.flavorText),
    examples: text(row.examples),
    category: text(row.taxonomy),
    tags: (Array.isArray(row.aliases) ? row.aliases : []).map(String),
  }
}

async function main() {
  const rewardIds = idList('rewards')
  const facetIds = idList('facets')
  if (!rewardIds.length && !facetIds.length) {
    console.error('Pass --rewards <ids> and/or --facets <ids> (comma separated).')
    process.exit(1)
  }

  const [characters, bots] = await Promise.all([
    getRows('/api/characters'),
    getRows('/api/bots'),
  ])
  const pool: SignalSpeakerProfile[] = [
    ...characters.map(characterProfile),
    ...bots.map(botProfile),
  ]
  const evidence = buildVoiceEvidenceIndex(loadArchive())

  const targets: SignalTargetProfile[] = []
  for (const id of rewardIds) {
    const row = await getRow(`/api/rewards/${id}`)
    if (!row) throw new Error(`Reward ${id} not found.`)
    const facets = await getRows(`/api/rewards/${id}/facets`)
    targets.push(rewardTarget(row, facets.map((facet) => Number(facet.id))))
  }
  if (facetIds.length) {
    const catalog = await getAllFacets()
    for (const id of facetIds) {
      const row = catalog.find((entry) => Number(entry.id) === id)
      if (!row) throw new Error(`Facet ${id} is not in the public catalog.`)
      targets.push(facetTarget(row))
    }
  }

  // Novelty is a batch property: casting one target changes the pressure on the
  // next. Carrying the tally across targets is what keeps a preview of a whole
  // batch honest about concentration.
  const castCounts = new Map<string, number>()
  const report: unknown[] = []

  for (const target of targets) {
    const context: CastingContext = { evidence, castCounts }
    const scored = scoreSpeakerPool(target, pool, context).sort(
      (left, right) => weightedTotal(right) - weightedTotal(left),
    )
    const ranked = rankCommentSpeakers(
      { type: target.type, id: target.id, title: target.title },
      scored,
      3,
    )
    for (const speaker of ranked.slice(0, 2)) {
      const key = speakerKey(speaker)
      castCounts.set(key, (castCounts.get(key) || 0) + 1)
    }

    console.log(`\n${'='.repeat(70)}\n${target.type} ${target.id} — ${target.title}`)
    if (target.category) console.log(`  [${target.category}]`)
    if (target.description) console.log(`  ${target.description}`)
    if (target.flavorText) console.log(`  "${target.flavorText}"`)
    console.log(`\n  Top ${top} of ${scored.length} castable speakers:`)

    for (const [position, speaker] of scored.slice(0, top).entries()) {
      console.log(
        `  ${position + 1}. ${speaker.name} (${speaker.kind}:${speaker.id})  ` +
          `total ${weightedTotal(speaker).toFixed(1)}  ` +
          `rel ${speaker.relationshipScore} · aff ${speaker.targetAffinityScore} · ` +
          `voice ${speaker.voiceEvidenceScore} · nov ${speaker.noveltyScore}`,
      )
      console.log(`     ${speaker.signalNotes.join(' | ')}`)
    }

    console.log(`\n  Cast: ${ranked.map((speaker) => speaker.name).join(', ')}`)
    for (const speaker of ranked) {
      console.log(`    ${speaker.name}: ${speaker.reasons.join(', ') || 'no threshold met'}`)
    }

    if (showSamples) {
      for (const speaker of ranked) {
        const samples = selectVoiceSamples(evidence.get(speakerKey(speaker)))
        console.log(
          `\n  -- ${speaker.name} voice evidence (${voiceEvidenceTier(
            evidence.get(speakerKey(speaker)),
          )}):`,
        )
        for (const sample of samples) console.log(`     [${sample.draftId}] ${sample.text}`)
      }
    }

    report.push({
      target,
      candidates: scored.slice(0, top).map((speaker) => ({
        ...speaker,
        weightedTotal: Number(weightedTotal(speaker).toFixed(2)),
      })),
      cast: ranked.map((speaker) => ({
        kind: speaker.kind,
        id: speaker.id,
        name: speaker.name,
        score: Number(speaker.score.toFixed(2)),
        reasons: speaker.reasons,
        tier: voiceEvidenceTier(evidence.get(speakerKey(speaker))),
        draftIds: selectVoiceSamples(evidence.get(speakerKey(speaker))).map(
          (sample) => sample.draftId,
        ),
      })),
    })
  }

  if (jsonOut) {
    writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`)
    console.log(`\nWrote ${jsonOut}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
