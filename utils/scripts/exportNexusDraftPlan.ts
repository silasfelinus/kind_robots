// /utils/scripts/exportNexusDraftPlan.ts
//
// Authoring input for the SECOND comment pass, over the public API, no database.
//
//   npx tsx utils/scripts/exportNexusDraftPlan.ts --count 20
//   npx tsx utils/scripts/exportNexusDraftPlan.ts --keys DREAM:5646,SCENARIO:65
//   npx tsx utils/scripts/exportNexusDraftPlan.ts --count 20 --json plan.json
//
// This is a different problem from the first pass and the difference is worth
// stating, because the obvious move -- reuse exportPopulationDraftPlan and walk
// further down the list -- is wrong twice over.
//
// SELECTION. The first pass walked a positional list because its publisher
// matched payload to production by index. Nothing here does: the nexus
// publisher keys on (target, speaker, exact text). So this exporter is free to
// choose, and it chooses by DENSITY -- how many comments a card already has,
// measured live. That is the only ordering that answers Silas's actual
// request ("keep adding to wherever could use them"), and it cannot be derived
// from the catalogue at all; it has to be read from production every run,
// because the answer changes every time a batch publishes.
//
// CONTEXT. Every target here already has comments on it. A speaker arriving
// second needs to see what was already said -- to avoid repeating it, and to
// have the option of answering it. So each entry carries the live comments with
// their first-party authors, which is also what makes a `repliesTo` anchor
// possible to write correctly rather than guess.
//
// The visit cap is deliberately looser than the first pass's 2. That cap
// existed to stop four voices doing all the talking across 296 virgin targets.
// Here the goal is density on fewer cards, and a character turning up in three
// or four places they genuinely belong reads as a populated world; the same
// character in thirty reads as the only character.
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
import { withFacetAttributes } from './../../utils/comments/facetAttributeMatch'
import {
  buildCastingIndex,
  connectionsFor,
  type CastTier,
} from './../../utils/comments/populationCasting'
import {
  botProfile,
  characterProfile,
  targetProfile,
  POPULATION_ENDPOINTS,
} from './../../utils/comments/populationProfiles'
import {
  isEligiblePopulationRow,
  populationTargetKey,
  populationTargetTitle,
  POPULATION_TARGET_TYPES,
  type PopulationRow,
  type PopulationTargetType,
} from './../../utils/comments/populationTargets'
import { createFetcher, pool as poolMap } from './../../utils/comments/fitnessLoader'

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`)
  const value = process.argv[index + 1]
  return index > -1 && value ? value : fallback
}

const baseUrl = arg('base', 'https://kindrobots.org').replace(/\/+$/, '')
const count = Number(arg('count', '20'))
const skip = Number(arg('skip', '0'))
const jsonOut = arg('json', '')
const onlyKeys = arg('keys', '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
const onlyType = arg('type', '').toUpperCase()
/** How many comments a card may already have and still count as thin. */
const thinAt = Number(arg('thin-at', '99'))
/** How many DIFFERENT cards one speaker may be cast onto in this run. */
const visitCap = Number(arg('visit-cap', '4'))
/** Visitors to cast per card. */
const speakersPer = Number(arg('speakers', '3'))
const root = process.cwd()

const text = (value: unknown): string => String(value ?? '').trim()
const get = createFetcher(baseUrl)

/**
 * Rank as many speakers as asked for, in rounds.
 *
 * `rankCommentSpeakers` caps its own return at three and floors it at one, and
 * both are pinned by verifyCommentMigrationFoundation ("three is the hard cap",
 * "one is the floor"). Those are the right numbers for a first comment on a
 * fresh object and the wrong ones here -- a bar wants a crowd, and asking for
 * zero more speakers must mean zero, not one.
 *
 * So the cap is respected and worked around rather than raised: candidates
 * already chosen are removed and the ranker is called again. Same weights, same
 * reasons, same order it would have produced with a larger limit.
 */
function rankMany<T extends { kind: 'BOT' | 'CHARACTER'; id: number }>(
  profile: Parameters<typeof rankCommentSpeakers>[0],
  candidates: T[],
  want: number,
): ReturnType<typeof rankCommentSpeakers> {
  const out: ReturnType<typeof rankCommentSpeakers> = []
  const taken = new Set<string>()
  while (out.length < want) {
    const remaining = candidates.filter((entry) => !taken.has(speakerKey(entry)))
    if (!remaining.length) break
    const round = rankCommentSpeakers(
      profile,
      remaining as Parameters<typeof rankCommentSpeakers>[1],
      Math.min(3, want - out.length),
    )
    if (!round.length) break
    for (const speaker of round) {
      if (out.length >= want) break
      taken.add(speakerKey(speaker))
      out.push(speaker)
    }
  }
  return out
}

async function getRows(path: string): Promise<PopulationRow[]> {
  const body = await get<PopulationRow[] | { data?: PopulationRow[] }>(path)
  return Array.isArray(body) ? body : body?.data || []
}

/** The reaction read route serves KarmaRefType names, not the packet's. */
const TARGET_ROUTE: Record<PopulationTargetType, string> = {
  BOT: 'bot',
  CHARACTER: 'character',
  DREAM: 'dream',
  SCENARIO: 'scenario',
  PROJECT: 'project',
}

type LiveReaction = {
  comment: string | null
  authorBotId: number | null
  authorCharacterId: number | null
  AuthorBot?: { name?: string } | null
  AuthorCharacter?: { name?: string } | null
}

type LiveComment = { speaker: string | null; name: string; comment: string }

async function liveCommentsOn(
  type: PopulationTargetType,
  id: number,
): Promise<LiveComment[]> {
  const body = await get<LiveReaction[] | { reactions?: LiveReaction[] }>(
    `/api/reactions/${TARGET_ROUTE[type]}/${id}`,
  )
  // Flat array under `data` from the generic route; nested under
  // `data.reactions` from the older hand-written dream route. Assuming the flat
  // shape makes every Dream look empty, which is how a survey once reported one
  // comment per Dream when there were four.
  const rows = Array.isArray(body) ? body : body?.reactions || []
  return rows.map((row) => ({
    speaker:
      row.authorBotId != null
        ? `BOT:${row.authorBotId}`
        : row.authorCharacterId != null
          ? `CHARACTER:${row.authorCharacterId}`
          : null,
    name: text(row.AuthorBot?.name) || text(row.AuthorCharacter?.name) || 'a visitor',
    comment: text(row.comment),
  }))
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
 * How often each speaker has been cast across every corpus that has shipped or
 * is drafted -- facets, population, and this pass's own earlier batches.
 *
 * Novelty carries only 0.05 of the casting weight, which is nowhere near enough
 * to move a high-affinity speaker on its own; without a real count the same
 * dozen voices win every card. Reading this pass's own drafts matters most:
 * without it, every batch would start from the same standing and re-cast the
 * same favourites file after file.
 */
function priorCastCounts(): Map<string, number> {
  const all = new Map<string, number>()
  for (const dir of [
    'comment-backfill-drafts',
    'population-comment-drafts',
    'nexus-comment-drafts',
  ]) {
    const path = join(root, 'config', dir)
    let names: string[]
    try {
      names = readdirSync(path).filter((file) => file.endsWith('.json'))
    } catch {
      continue
    }
    for (const name of names) {
      const packet = JSON.parse(readFileSync(join(path, name), 'utf8')) as {
        items?: Array<{ speakers?: Array<{ kind: 'BOT' | 'CHARACTER'; id: number }> }>
      }
      for (const item of packet.items || []) {
        for (const speaker of item.speakers || []) {
          const key = speakerKey(speaker)
          all.set(key, (all.get(key) || 0) + 1)
        }
      }
    }
  }
  return all
}

/** Targets already carrying a comment authored by this pass, and by whom. */
function draftedHere(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  const path = join(root, 'config', 'nexus-comment-drafts')
  let names: string[]
  try {
    names = readdirSync(path).filter((file) => file.endsWith('.json'))
  } catch {
    return map
  }
  for (const name of names) {
    const packet = JSON.parse(readFileSync(join(path, name), 'utf8')) as {
      items?: Array<{
        targetType: PopulationTargetType
        targetId: number
        speakers?: Array<{ kind: 'BOT' | 'CHARACTER'; id: number }>
      }>
    }
    for (const item of packet.items || []) {
      const key = populationTargetKey(item.targetType, item.targetId)
      const set = map.get(key) || new Set<string>()
      for (const speaker of item.speakers || []) set.add(speakerKey(speaker))
      map.set(key, set)
    }
  }
  return map
}

async function getAllFacets(): Promise<PopulationRow[]> {
  const all: PopulationRow[] = []
  for (let cursor = 0; cursor < 5000; cursor += 250) {
    const page = await getRows(`/api/facets?take=250&skip=${cursor}`)
    all.push(...page)
    if (page.length < 250) break
  }
  return all
}

async function main() {
  const [byType, characters, bots, facets] = await Promise.all([
    Promise.all(
      POPULATION_TARGET_TYPES.map(async (type) => {
        const rows = await getRows(POPULATION_ENDPOINTS[type])
        return rows
          .filter((row) => isEligiblePopulationRow(type, row))
          .map((row) => ({ type, id: Number(row.id), row }))
          .filter((entry) => Number.isInteger(entry.id) && entry.id > 0)
      }),
    ),
    getRows(POPULATION_ENDPOINTS.CHARACTER),
    getRows(POPULATION_ENDPOINTS.BOT),
    getAllFacets(),
  ])
  let targets = byType.flat()
  if (onlyType) targets = targets.filter((entry) => entry.type === onlyType)

  const alreadyDrafted = draftedHere()

  // Density is read live, per target. It is the whole basis of selection here
  // and there is no way to infer it from the catalogue -- a card with four
  // comments and a card with none look identical in /api/dreams.
  const withCounts = await poolMap(
    targets,
    async (target) => {
      const key = populationTargetKey(target.type, target.id)
      const live = await liveCommentsOn(target.type, target.id)
      return {
        ...target,
        key,
        live,
        // Comments already drafted for this card but not yet published count
        // toward density, or two runs in a row would both call it empty.
        density: live.length + (alreadyDrafted.get(key)?.size || 0),
      }
    },
    12,
  )

  const chosen = (
    onlyKeys.length
      ? withCounts.filter((entry) => onlyKeys.includes(entry.key))
      : withCounts.filter((entry) => entry.density <= thinAt)
  )
    // Thinnest first; ties broken by type order then id so a re-run with the
    // same arguments yields the same slice.
    .sort((left, right) => {
      if (left.density !== right.density) return left.density - right.density
      const byType =
        POPULATION_TARGET_TYPES.indexOf(left.type) -
        POPULATION_TARGET_TYPES.indexOf(right.type)
      return byType !== 0 ? byType : left.id - right.id
    })
    .slice(skip, skip + count)

  const speakerPool = withFacetAttributes(
    [...characters.map(characterProfile), ...bots.map(botProfile)],
    facets.map((row) => ({
      id: Number(row.id),
      title: text(row.title) || null,
      groupKey: text(row.groupKey) || null,
      groupLabel: text(row.groupLabel) || null,
      aliases: (row.aliases as string[] | string | null) ?? null,
    })),
  )
  const poolByKey = new Map(speakerPool.map((entry) => [speakerKey(entry), entry]))

  const facetCharacters = new Map<number, number[]>()
  for (const entry of speakerPool) {
    if (entry.kind !== 'CHARACTER') continue
    for (const facetId of entry.facetIds || []) {
      facetCharacters.set(facetId, [...(facetCharacters.get(facetId) || []), entry.id])
    }
  }

  const castingIndex = buildCastingIndex({
    characters,
    bots,
    dreams: await getRows(POPULATION_ENDPOINTS.DREAM),
    scenarios: await getRows(POPULATION_ENDPOINTS.SCENARIO),
    facetCharacters,
  })

  const evidence = buildVoiceEvidenceIndex(loadArchive())
  const castCounts = priorCastCounts()
  const visits = new Map<string, number>()
  const seedById = new Map<number, (typeof characterVoiceSeeds)[number]>(
    characterVoiceSeeds.map((seed) => [seed.id, seed]),
  )
  const tierCounts = new Map<CastTier, number>()

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

  const plan = []
  for (const target of chosen) {
    const profile = targetProfile(target.type, target.row)
    const selfKey =
      target.type === 'BOT' || target.type === 'CHARACTER'
        ? `${target.type}:${target.id}`
        : null
    // Whoever already spoke here does not get cast again on the same card. They
    // may still be ANSWERED -- that is what the live comment list is for.
    const spoken = new Set<string>([
      ...target.live.map((entry) => entry.speaker).filter(Boolean).map(String),
      ...(alreadyDrafted.get(target.key) || []),
    ])

    const scored = scoreSpeakerPool(profile, speakerPool, { evidence, castCounts })
    const connection = connectionsFor(target.type, target.row, castingIndex)
    const allowed = new Set(connection.allowed.map((ref) => speakerKey(ref)))

    const notAlready = (entry: { kind: 'BOT' | 'CHARACTER'; id: number }) => {
      const key = speakerKey(entry)
      return key !== selfKey && !spoken.has(key)
    }
    // Connection LEADS here; it does not gate.
    //
    // The first pass treated connection as a hard allow list, which was right
    // when every card was empty and the risk was casting a stranger onto an
    // object nobody was tied to. It is wrong for this pass, and the eight
    // best cards proved it: Serendipity Space Bar -- a BAR, the exact example
    // Silas gave for wanting bustle -- returned exactly one eligible speaker,
    // because only one character is formally connected to it.
    //
    // Silas, on this pass: "we are a multidimensional storytelling experience.
    // Creatures can pop in in strange and unexpected places." So connected
    // speakers are cast first and in order, and any remaining slots are filled
    // from the affinity ranking at large. Every speaker is labelled with which
    // it was, so the writing can lean on a real tie where one exists and play
    // the arrival as strange where it does not.
    const available = scored.filter(
      (entry) =>
        notAlready(entry) && (visits.get(speakerKey(entry)) || 0) < visitCap,
    )
    const connected = available.filter((entry) => allowed.has(speakerKey(entry)))
    const strangers = available.filter((entry) => !allowed.has(speakerKey(entry)))
    const tier = connected.length ? connection.tier : 'unconnected'
    tierCounts.set(tier, (tierCounts.get(tier) || 0) + 1)

    const led = rankMany(profile, connected, speakersPer)
    const ledKeys = new Set(led.map((speaker) => speakerKey(speaker)))
    const filled = rankMany(profile, strangers, speakersPer - led.length)
    const cast = [...led, ...filled]
    for (const speaker of cast) {
      const key = speakerKey(speaker)
      castCounts.set(key, (castCounts.get(key) || 0) + 1)
      visits.set(key, (visits.get(key) || 0) + 1)
    }

    plan.push({
      key: target.key,
      title: populationTargetTitle(target.type, target.row),
      type: target.type,
      density: target.density,
      castTier: tier,
      category: profile.category,
      description: profile.description,
      flavorText: profile.flavorText,
      /** What is already on this card, oldest last, as the route returns it. */
      existing: target.live,
      speakers: cast.map((speaker) => ({
        kind: speaker.kind,
        id: speaker.id,
        name: speaker.name,
        /** 'connected' if a rule tied them here; 'arrival' if affinity alone. */
        standing: ledKeys.has(speakerKey(speaker)) ? 'connected' : 'arrival',
        score: speaker.score,
        reasons: speaker.reasons,
        priorComments: (castCounts.get(speakerKey(speaker)) || 1) - 1,
        ...voiceMaterial(speaker),
      })),
    })
  }

  if (jsonOut) {
    writeFileSync(resolve(root, jsonOut), `${JSON.stringify(plan, null, 2)}\n`, 'utf8')
    console.log(`Wrote ${plan.length} planned target(s) to ${jsonOut}.`)
  } else {
    for (const entry of plan) {
      console.log('='.repeat(70))
      console.log(`${entry.key} — ${entry.title}   (${entry.density} existing, ${entry.castTier})`)
      if (entry.category) console.log(`  ${entry.category}`)
      if (entry.description) console.log(`  ${entry.description.replace(/\s+/g, ' ').slice(0, 320)}`)
      if (entry.flavorText) console.log(`  flavor: ${entry.flavorText.replace(/\s+/g, ' ').slice(0, 200)}`)
      for (const said of entry.existing) {
        console.log(`  ALREADY ${said.speaker || 'user'} ${said.name}: ${said.comment.replace(/\s+/g, ' ').slice(0, 200)}`)
      }
      for (const speaker of entry.speakers) {
        console.log(`\n  CAST (${speaker.standing}): ${speaker.name} (${speaker.kind}:${speaker.id}) voice ${speaker.voiceTier}`)
        if (speaker.voice) console.log(`    voice: ${speaker.voice.replace(/\s+/g, ' ').slice(0, 240)}`)
        if (speaker.canonicalSample) {
          console.log(`    canonical: ${speaker.canonicalSample.replace(/\s+/g, ' ').slice(0, 200)}`)
        }
        for (const sample of speaker.archiveSamples) {
          console.log(`    archive: ${sample.replace(/\s+/g, ' ').slice(0, 200)}`)
        }
      }
      console.log('')
    }
  }

  const tiers = [...tierCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([tier, n]) => `${tier} ${n}`)
  const densities = withCounts.map((entry) => entry.density).sort((a, b) => a - b)
  console.log(
    `Eligible ${withCounts.length}, densities ${densities[0]}..${densities[densities.length - 1]} (median ${densities[Math.floor(densities.length / 2)]}), ${withCounts.filter((e) => e.density === 0).length} empty. Cast by connection: ${tiers.join(', ')}.`,
  )
}

await main()
