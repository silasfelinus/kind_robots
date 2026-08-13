// /utils/scripts/exportPopulationDraftPlan.ts
//
// Authoring input for the population pass, over the public API, no database.
//
// Same idea as exportFacetDraftPlan.ts and the same hard-won rule: the eligible
// list must be derived from utils/comments/populationTargets.ts, never restated
// here, because the payload is matched to production BY POSITION.
//
//   npx tsx utils/scripts/exportPopulationDraftPlan.ts --from 0 --count 24
//   npx tsx utils/scripts/exportPopulationDraftPlan.ts --from 0 --count 24 --json plan.json
//
// For a VISIT_REPLY target the cast is one visitor; the reply slot is the
// target speaking as itself, so its own voice material is emitted separately as
// `self`. Casting a second visitor there would be wrong -- the reply is not a
// casting decision.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { rankCommentSpeakers } from './../../utils/comments/commentCasting'
import { scoreSpeakerPool } from './../../utils/comments/commentSignals'
import {
  buildVoiceEvidenceIndex,
  selectVoiceSamples,
  speakerKey,
  voiceEvidenceTier,
  type ArchivedVoiceRecord,
} from './../../utils/comments/voiceEvidence'
import { characterVoiceSeeds } from './../../stores/seeds/characterVoices'
import {
  botProfile,
  characterProfile,
  targetProfile,
  POPULATION_ENDPOINTS,
} from './../../utils/comments/populationProfiles'
import { withFacetAttributes } from './../../utils/comments/facetAttributeMatch'
import {
  buildCastingIndex,
  connectionsFor,
  type CastTier,
} from './../../utils/comments/populationCasting'
import {
  isEligiblePopulationRow,
  orderPopulationTargets,
  populationSelfSpeaker,
  populationShapeFor,
  populationSpeakerCount,
  populationTargetKey,
  POPULATION_TARGET_TYPES,
  type PopulationRow,
} from './../../utils/comments/populationTargets'

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`)
  const value = process.argv[index + 1]
  return index > -1 && value ? value : fallback
}

const baseUrl = arg('base', 'https://kindrobots.org').replace(/\/+$/, '')
const from = Number(arg('from', '0'))
const count = Number(arg('count', '24'))
const jsonOut = arg('json', '')
// How many DIFFERENT objects one speaker may visit across the whole pass.
// noveltyScore carries only 0.05 of the casting weight, which is not enough to
// move a high-affinity speaker: the first twelve Bots drew AMI Butterfly three
// times. A populated universe is not four voices being busy, so the pool drops
// a speaker once they have visited this many targets. With ~296 visitor slots
// and a pool of ~296 speakers, a cap of 2 is comfortable and still spreads.
const visitCap = Number(arg('visit-cap', '2'))
const root = process.cwd()

const text = (value: unknown): string => String(value ?? '').trim()

async function getRows(path: string): Promise<PopulationRow[]> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`)
  const body = (await response.json()) as
    | PopulationRow[]
    | { data?: PopulationRow[] }
  return Array.isArray(body) ? body : body.data || []
}

async function loadEligibleTargets() {
  const pages = await Promise.all(
    POPULATION_TARGET_TYPES.map(async (type) => {
      const rows = await getRows(POPULATION_ENDPOINTS[type])
      return rows
        .filter((row) => isEligiblePopulationRow(type, row))
        .map((row) => ({ type, id: Number(row.id), row }))
        .filter((entry) => Number.isInteger(entry.id) && entry.id > 0)
    }),
  )
  return orderPopulationTargets(pages.flat())
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

/**
 * Prior cast counts across BOTH corpora. The facet lane's 961 comments are the
 * reason a speaker with sixteen appearances should not be handed a seventeenth
 * while ninety-five speakers have never said anything -- novelty has to see the
 * work that already shipped, not just this pass.
 */
function priorCastCounts(): {
  all: Map<string, number>
  visits: Map<string, number>
} {
  const all = new Map<string, number>()
  const visits = new Map<string, number>()
  for (const dir of ['comment-backfill-drafts', 'population-comment-drafts']) {
    const path = join(root, 'config', dir)
    let names: string[]
    try {
      names = readdirSync(path).filter((file) => /^batch-\d+\.json$/.test(file))
    } catch {
      continue
    }
    for (const name of names) {
      const packet = JSON.parse(readFileSync(join(path, name), 'utf8')) as {
        items: Array<{
          key?: string
          shape?: string
          speakers: Array<{ kind: 'BOT' | 'CHARACTER'; id: number }>
        }>
      }
      for (const item of packet.items) {
        for (const [slot, speaker] of item.speakers.entries()) {
          const key = speakerKey(speaker)
          all.set(key, (all.get(key) || 0) + 1)
          // Only the visitor slot counts toward the spread cap. A Bot answering
          // on its own card is not "appearing again" -- it is the one speaker
          // that target could ever have.
          const isSelfReply = dir === 'population-comment-drafts' && slot === 1
          if (dir === 'population-comment-drafts' && !isSelfReply) {
            visits.set(key, (visits.get(key) || 0) + 1)
          }
        }
      }
    }
  }
  return { all, visits }
}

async function getAllFacets(): Promise<PopulationRow[]> {
  const all: PopulationRow[] = []
  for (let skip = 0; skip < 5000; skip += 250) {
    const page = await getRows(`/api/facets?take=250&skip=${skip}`)
    all.push(...page)
    if (page.length < 250) break
  }
  return all
}

async function main() {
  const [targets, characters, bots, dreams, facets] = await Promise.all([
    loadEligibleTargets(),
    getRows('/api/characters'),
    getRows('/api/bots?page=1&pageSize=200'),
    getRows(POPULATION_ENDPOINTS.DREAM),
    getAllFacets(),
  ])

  if (from < 0 || from >= targets.length) {
    throw new Error(
      `--from ${from} is outside the eligible range 0..${targets.length - 1}.`,
    )
  }

  // Characters carry facet attributes so a scenario built from "Circus" can
  // reach whoever actually IS circus, rather than whoever happened to use the
  // word. Same group-scoped matcher the facet lane uses.
  const pool = withFacetAttributes(
    [...characters.map(characterProfile), ...bots.map(botProfile)],
    facets.map((row) => ({
      id: Number(row.id),
      title: text(row.title) || null,
      groupKey: text(row.groupKey) || null,
      groupLabel: text(row.groupLabel) || null,
      aliases: (row.aliases as string[] | string | null) ?? null,
    })),
  )
  const poolByKey = new Map(pool.map((entry) => [speakerKey(entry), entry]))

  // facetId -> characters carrying it, inverted from the matcher above.
  const facetCharacters = new Map<number, number[]>()
  for (const entry of pool) {
    if (entry.kind !== 'CHARACTER') continue
    for (const facetId of entry.facetIds || []) {
      facetCharacters.set(facetId, [
        ...(facetCharacters.get(facetId) || []),
        entry.id,
      ])
    }
  }

  const castingIndex = buildCastingIndex({
    characters,
    bots,
    dreams,
    scenarios: await getRows(POPULATION_ENDPOINTS.SCENARIO),
    facetCharacters,
  })
  const tierCounts = new Map<CastTier, number>()

  const evidence = buildVoiceEvidenceIndex(loadArchive())
  const { all: castCounts, visits } = priorCastCounts()
  const seedById = new Map<number, (typeof characterVoiceSeeds)[number]>(
    characterVoiceSeeds.map((seed) => [seed.id, seed]),
  )

  const voiceMaterial = (speaker: { kind: 'BOT' | 'CHARACTER'; id: number }) => {
    const key = speakerKey(speaker)
    const source = poolByKey.get(key)
    const seed = speaker.kind === 'CHARACTER' ? seedById.get(speaker.id) : undefined
    return {
      voiceTier: voiceEvidenceTier(evidence.get(key)),
      voice: seed?.voice || source?.voice || source?.narrativeVoice || null,
      canonicalSample: seed?.sampleResponse || source?.sampleResponse || null,
      archiveSamples: selectVoiceSamples(evidence.get(key), 3).map((s) => s.text),
    }
  }

  const slice = targets.slice(from, from + count)
  const plan = []

  for (const [offset, target] of slice.entries()) {
    const index = from + offset
    const shape = populationShapeFor(target.type)
    const profile = targetProfile(target.type, target.row)
    const self = populationSelfSpeaker(target.type, target.id)

    // A VISIT_REPLY casts ONE visitor -- the reply slot belongs to the target.
    const visitorCount = populationSpeakerCount(shape) - (self ? 1 : 0)

    // scoreSpeakerPool first: rankCommentSpeakers expects candidates that
    // already carry their signals. Handing it a raw pool sorts by pool order at
    // score 0 and casts the same speaker on every target.
    const scored = scoreSpeakerPool(profile, pool, { evidence, castCounts })
    // Connection is a GATE, not a weight: only speakers actually tied to this
    // object may speak on it. Affinity then picks among them. An empty allow
    // list means no rule reached anybody, and the whole pool is back in play --
    // reported as `unconnected` rather than dressed up as a connection.
    const connection = connectionsFor(target.type, target.row, castingIndex)
    const allowed = new Set(
      connection.allowed.map((ref) => speakerKey(ref)),
    )

    // An object may not be its own visitor, and a speaker who has already
    // toured `visitCap` objects steps aside so somebody else gets a turn.
    const gate = (entry: { kind: 'BOT' | 'CHARACTER'; id: number }) => {
      const key = speakerKey(entry)
      if (self && key === speakerKey(self)) return false
      if (allowed.size && !allowed.has(key)) return false
      return (visits.get(key) || 0) < visitCap
    }

    let eligible = scored.filter(gate)
    let tier = connection.tier
    // The cap must never starve a target of its only connected speakers. If
    // every connected candidate is already at their limit, let them through
    // again rather than casting a stranger -- a real connection said twice is
    // better than a plausible one said once.
    if (!eligible.length && allowed.size) {
      eligible = scored.filter((entry) => {
        const key = speakerKey(entry)
        if (self && key === speakerKey(self)) return false
        return allowed.has(key)
      })
    }
    if (!eligible.length) {
      tier = 'unconnected'
      eligible = scored.filter((entry) => {
        const key = speakerKey(entry)
        if (self && key === speakerKey(self)) return false
        return (visits.get(key) || 0) < visitCap
      })
    }
    tierCounts.set(tier, (tierCounts.get(tier) || 0) + 1)
    const cast = rankCommentSpeakers(profile, eligible, visitorCount)
    for (const speaker of cast) {
      const key = speakerKey(speaker)
      castCounts.set(key, (castCounts.get(key) || 0) + 1)
      visits.set(key, (visits.get(key) || 0) + 1)
    }

    plan.push({
      index,
      key: populationTargetKey(target.type, target.id),
      title: profile.title,
      type: target.type,
      shape,
      castTier: tier,
      category: profile.category,
      description: profile.description,
      flavorText: profile.flavorText,
      speakers: cast.map((speaker) => ({
        role: 'VISITOR' as const,
        kind: speaker.kind,
        id: speaker.id,
        name: speaker.name,
        score: speaker.score,
        reasons: speaker.reasons,
        priorComments: (castCounts.get(speakerKey(speaker)) || 1) - 1,
        ...voiceMaterial(speaker),
      })),
      // Present only for VISIT_REPLY. This is who answers, and it is fixed.
      self: self
        ? {
            role: 'SELF' as const,
            kind: self.kind,
            id: self.id,
            name: profile.title,
            ...voiceMaterial(self),
          }
        : null,
    })
  }

  function reportTiers() {
    const parts = [...tierCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([tier, n]) => `${tier} ${n}`)
    console.log(`Cast by connection: ${parts.join(', ')}.`)
  }

  if (jsonOut) {
    writeFileSync(resolve(root, jsonOut), `${JSON.stringify(plan, null, 2)}\n`, 'utf8')
    reportTiers()
    console.log(`Wrote ${plan.length} planned target(s) to ${jsonOut}.`)
    return
  }

  for (const entry of plan) {
    console.log('='.repeat(70))
    console.log(`[${entry.index}] ${entry.key} — ${entry.title}   (${entry.shape})`)
    if (entry.category) console.log(`  ${entry.category}`)
    if (entry.description) console.log(`  ${entry.description.slice(0, 300)}`)
    if (entry.flavorText) console.log(`  flavor: ${entry.flavorText.slice(0, 200)}`)
    for (const speaker of [...entry.speakers, ...(entry.self ? [entry.self] : [])]) {
      console.log(
        `\n  ${speaker.role}: ${speaker.name} (${speaker.kind}:${speaker.id}) voice ${speaker.voiceTier}`,
      )
      if (speaker.voice) {
        console.log(`    voice: ${speaker.voice.replace(/\s+/g, ' ').slice(0, 240)}`)
      }
      if (speaker.canonicalSample) {
        console.log(
          `    canonical: ${speaker.canonicalSample.replace(/\s+/g, ' ').slice(0, 200)}`,
        )
      }
      for (const sample of speaker.archiveSamples) {
        console.log(`    archive: ${sample.replace(/\s+/g, ' ').slice(0, 200)}`)
      }
    }
    console.log('')
  }
  reportTiers()
  console.log(
    `${plan.length} target(s), indices ${from}..${from + plan.length - 1} of ${targets.length}.`,
  )
}

await main()
