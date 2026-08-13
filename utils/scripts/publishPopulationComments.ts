// /utils/scripts/publishPopulationComments.ts
//
// Production publisher for the population pass.
//
// Same contract as the #1769 publisher and the same hazards, so the same
// defences: the payload is a PREFIX of the eligible target list matched BY
// POSITION, every prose rule is re-checked against live production state before
// anything is written, each exchange is inserted atomically, and a target that
// already carries a first-party comment is skipped so re-running is safe.
//
// The eligible list is derived from utils/comments/populationTargets.ts -- the
// same module the exporter uses -- because a disagreement about which rows are
// eligible, or what order they come in, silently attaches every later comment
// to the wrong object.
//
// One rule this publisher has that the facet one does not: on a VISIT_REPLY the
// second speaker MUST be the target answering as itself. Both a Bot and a
// Character are valid first-party authors, so publishing one Bot's reply under
// another Bot's name would look completely normal in the database and read as
// nonsense on the card.
//
//   npx tsx utils/scripts/publishPopulationComments.ts
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import prisma from '@/server/utils/prisma'
import {
  ReactionType,
  Reaction_reactionCategory,
  type Prisma,
} from '@/prisma/generated/prisma/client'
import { archivedVoiceRecords } from '@/utils/comments/archivedVoiceCorpus'
import {
  buildVoiceEvidenceIndex,
  speakerKey,
} from '@/utils/comments/voiceEvidence'
import { characterVoiceSeeds } from '@/stores/seeds/characterVoices'
import { assertSingleFirstPartyReactionAuthor } from '@/utils/reactions/firstPartyReactionAuthor'
import {
  isEligiblePopulationRow,
  orderPopulationTargets,
  populationSelfSpeaker,
  populationShapeFor,
  populationSpeakerCount,
  populationTargetKey,
  populationTargetTitle,
  POPULATION_TARGET_TYPES,
  type PopulationRow,
  type PopulationTargetType,
} from '@/utils/comments/populationTargets'

const PUBLISHER_USER_ID = 1
const EXPECTED_RELEASE_GATE = 'GPT-5.6 Sol'
const BANNED_REVIEW_LANGUAGE =
  /\b(components?|wonderlabs?|museums?|exhibits?|star ratings?|ratings?|reviews?|implementations?|usability)\b/i

const CATEGORY: Record<PopulationTargetType, Reaction_reactionCategory> = {
  BOT: Reaction_reactionCategory.BOT,
  CHARACTER: Reaction_reactionCategory.CHARACTER,
  DREAM: Reaction_reactionCategory.DREAM,
  SCENARIO: Reaction_reactionCategory.SCENARIO,
  PROJECT: Reaction_reactionCategory.PROJECT,
}

const COLUMN: Record<PopulationTargetType, string> = {
  BOT: 'botId',
  CHARACTER: 'characterId',
  DREAM: 'dreamId',
  SCENARIO: 'scenarioId',
  PROJECT: 'projectId',
}

type PacketSpeaker = {
  kind: 'BOT' | 'CHARACTER'
  id: number
  name: string
  comment: string
}
type PacketItem = { key: string; shape: string; speakers: PacketSpeaker[] }
type Packet = {
  version: number
  start: number
  eligibleTargets?: number
  releaseGate: string
  draftingModel?: string
  items: PacketItem[]
}

const DRY_RUN = process.argv.includes('--dry-run')

const root = process.cwd()
const draftsDir = join(root, 'config', 'population-comment-drafts')
const voiceIndex = buildVoiceEvidenceIndex(archivedVoiceRecords)
const seedById = new Map<number, (typeof characterVoiceSeeds)[number]>(
  characterVoiceSeeds.map((seed) => [seed.id, seed]),
)

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

/** Contiguous packets, ordered, flattened into one positional list. */
function loadPayload(): { items: PacketItem[]; eligibleDeclared: number | null } {
  const names = readdirSync(draftsDir)
    .filter((name) => /^batch-\d+\.json$/.test(name))
    .sort()
  if (!names.length) throw new Error(`No packets in ${draftsDir}.`)

  const items: PacketItem[] = []
  let cursor = 0
  let eligibleDeclared: number | null = null

  for (const name of names) {
    const packet = JSON.parse(
      readFileSync(join(draftsDir, name), 'utf8'),
    ) as Packet
    if (packet.version !== 1) {
      throw new Error(`${name}: unexpected packet version ${packet.version}.`)
    }
    if (packet.releaseGate !== EXPECTED_RELEASE_GATE) {
      throw new Error(`${name}: unexpected release gate ${packet.releaseGate}.`)
    }
    if (packet.start !== cursor) {
      throw new Error(
        `${name}: starts at ${packet.start} but the corpus is contiguous to ${cursor}. A gap would shift every later comment onto the wrong object.`,
      )
    }
    if (typeof packet.eligibleTargets === 'number') {
      if (eligibleDeclared === null) eligibleDeclared = packet.eligibleTargets
      else if (eligibleDeclared !== packet.eligibleTargets) {
        throw new Error(
          `${name}: declares ${packet.eligibleTargets} eligible targets, earlier packets declared ${eligibleDeclared}.`,
        )
      }
    }
    items.push(...packet.items)
    cursor += packet.items.length
  }

  return { items, eligibleDeclared }
}

const SELECT_COMMON = {
  id: true,
  isPublic: true,
  allowReviews: true,
} as const

/**
 * Run thunks one at a time, returning results in order.
 *
 * Tuple-typed on purpose: a plain `Array<() => Promise<T>>` collapses five
 * differently-shaped queries into one union and every destructured name comes
 * back wrong.
 */
async function serial<T extends readonly (() => Promise<unknown>)[]>(
  thunks: [...T],
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const out: unknown[] = []
  for (const thunk of thunks) out.push(await thunk())
  return out as { [K in keyof T]: Awaited<ReturnType<T[K]>> }
}

// EVERY DATABASE READ IN THIS FILE IS SERIALIZED, DELIBERATELY.
//
// Four lanes hung indefinitely on their first query from a CI runner while
// production itself stayed healthy, and a database + ProxySQL reboot did not
// clear it. The one job that has always worked against this database is
// `run_facet_catalog_maintenance`, whose own step is named "Run serialized
// Facet catalog maintenance" -- it opens one connection and keeps it.
//
// The hanging lanes all opened their reads with Promise.all: this one fanned
// out to roughly nine concurrent queries before doing anything. If the CI
// user's connection allowance is small, a parallel fan-out does not fail, it
// waits -- forever, with no error to report.
//
// So: one query at a time. It costs a few seconds when healthy, which is
// nothing against a lane that cannot run at all.
async function loadEligibleTargets() {
  const [bots, characters, dreams, scenarios, projects] = await serial([
    () => prisma.bot.findMany({
      select: {
        ...SELECT_COMMON,
        name: true,
        botIntro: true,
        description: true,
        personality: true,
        tagline: true,
        subtitle: true,
      },
    }),
    () => prisma.character.findMany({
      select: {
        ...SELECT_COMMON,
        name: true,
        personality: true,
        backstory: true,
        drive: true,
        quirks: true,
        role: true,
      },
    }),
    () => prisma.dream.findMany({
      select: {
        ...SELECT_COMMON,
        isActive: true,
        title: true,
        pitch: true,
        description: true,
        flavorText: true,
      },
    }),
    () => prisma.scenario.findMany({
      select: {
        ...SELECT_COMMON,
        isActive: true,
        title: true,
        description: true,
        locations: true,
        genres: true,
      },
    }),
    () => prisma.project.findMany({
      select: {
        ...SELECT_COMMON,
        isActive: true,
        title: true,
        description: true,
        pitch: true,
      },
    }),
  ])

  const byType: Record<PopulationTargetType, PopulationRow[]> = {
    BOT: bots as PopulationRow[],
    CHARACTER: characters as PopulationRow[],
    DREAM: dreams as PopulationRow[],
    SCENARIO: scenarios as PopulationRow[],
    PROJECT: projects as PopulationRow[],
  }

  const targets = POPULATION_TARGET_TYPES.flatMap((type) =>
    byType[type]
      .filter((row) => isEligiblePopulationRow(type, row))
      .map((row) => ({
        type,
        id: Number(row.id),
        title: populationTargetTitle(type, row),
      })),
  )

  return orderPopulationTargets(targets)
}

/** Targets that already carry a first-party comment, so a re-run is a no-op. */
async function loadExistingTargets(): Promise<Set<string>> {
  const rows = await prisma.reaction.findMany({
    where: {
      OR: [
        { authorBotId: { not: null } },
        { authorCharacterId: { not: null } },
      ],
    },
    select: {
      botId: true,
      characterId: true,
      dreamId: true,
      scenarioId: true,
      projectId: true,
    },
  })
  const keys = new Set<string>()
  for (const row of rows) {
    for (const type of POPULATION_TARGET_TYPES) {
      const id = (row as unknown as Record<string, number | null>)[COLUMN[type]]
      if (typeof id === 'number' && id > 0) keys.add(populationTargetKey(type, id))
    }
  }
  return keys
}

async function loadAuthorDirectory() {
  const [bots, characters] = await serial([
    () => prisma.bot.findMany({ select: { id: true, name: true, sampleResponse: true } }),
    () =>
      prisma.character.findMany({
        select: { id: true, name: true, sampleResponse: true },
      }),
  ])
  const map = new Map<string, { name: string; sampleResponse: string | null }>()
  for (const bot of bots) {
    map.set(speakerKey({ kind: 'BOT', id: bot.id }), {
      name: bot.name,
      sampleResponse: bot.sampleResponse,
    })
  }
  for (const character of characters) {
    const seed = seedById.get(character.id)
    map.set(speakerKey({ kind: 'CHARACTER', id: character.id }), {
      name: character.name,
      // Seed-preferred, exactly as the drafting side resolves it.
      sampleResponse: seed?.sampleResponse || character.sampleResponse,
    })
  }
  return map
}

function validateFreshness(
  speaker: PacketSpeaker,
  canonical: string | null,
  authored: Map<string, string[]>,
) {
  const value = speaker.comment.trim()
  const words = normalizeWords(value)
  const key = speakerKey(speaker)

  if (value.length < 2 || value.length > 1200) {
    throw new Error(`${speaker.name}: comment is ${value.length} characters.`)
  }
  if (words.length < 4 || words.length > 120) {
    throw new Error(`${speaker.name}: ${words.length} words is out of range.`)
  }
  const banned = value.match(BANNED_REVIEW_LANGUAGE)?.[0]
  if (banned) {
    throw new Error(`${speaker.name}: reviewer language "${banned}".`)
  }
  for (const sample of voiceIndex.get(key)?.samples || []) {
    const overlap = sharedShingle(value, sample.text)
    if (overlap) {
      throw new Error(`${speaker.name}: reuses archived phrase "${overlap}".`)
    }
  }
  if (canonical) {
    const overlap = sharedShingle(value, canonical)
    if (overlap) {
      throw new Error(`${speaker.name}: reuses canonical phrase "${overlap}".`)
    }
  }
  for (const prior of authored.get(key) || []) {
    const overlap = sharedShingle(value, prior)
    if (overlap) {
      throw new Error(`${speaker.name}: repeats own phrase "${overlap}".`)
    }
  }
  authored.set(key, [...(authored.get(key) || []), value])
}

async function main() {
  const { items: payload, eligibleDeclared } = loadPayload()
  const [eligibleTargets, authors, existing, publisher] = await serial([
    () => loadEligibleTargets(),
    () => loadAuthorDirectory(),
    () => loadExistingTargets(),
    () =>
      prisma.user.findUnique({
        where: { id: PUBLISHER_USER_ID },
        select: { id: true, username: true },
      }),
  ])

  if (!publisher) {
    throw new Error(`Publisher user #${PUBLISHER_USER_ID} does not exist.`)
  }
  if (payload.length > eligibleTargets.length) {
    throw new Error(
      `Payload carries ${payload.length} targets; production has ${eligibleTargets.length} eligible.`,
    )
  }

  // Targets are matched BY KEY, not by position.
  //
  // This lane originally matched by position, the way the #1769 facet lane does,
  // and the first production dry run rejected the whole corpus for it: the
  // packets were written against 496 eligible targets and production had grown
  // to 505 by the time it ran. The daily dream cycle adds objects every day, so
  // that will keep happening.
  //
  // Position matching is not merely inconvenient here, it is dangerous. The
  // order is type rank then numeric id, so nine new Characters do not append at
  // the end -- they push every Dream, Scenario and Project down by nine, and a
  // payload applied by position would attach each of those comments to a
  // different object, all of them plausible and all of them wrong.
  //
  // The key is already in every packet item and every id is re-checked against
  // live rows below, so keying loses no safety. It gains the property that
  // matters for a catalog somebody is still adding to: a target the corpus has
  // never heard of is simply undrafted, rather than an off-by-nine.
  const eligibleByKey = new Map(
    eligibleTargets.map((target) => [
      populationTargetKey(target.type, target.id),
      target,
    ]),
  )
  const seenKeys = new Set<string>()
  const publishTargets: typeof eligibleTargets = []

  for (const [index, item] of payload.entries()) {
    const target = eligibleByKey.get(item.key)
    if (!target) {
      throw new Error(
        `Payload[${index}] targets ${item.key}, which is not an eligible production row (missing, private, or reviews-off).`,
      )
    }
    if (seenKeys.has(item.key)) {
      throw new Error(`Payload[${index}]: ${item.key} appears twice.`)
    }
    seenKeys.add(item.key)
    publishTargets.push(target)
  }

  if (eligibleDeclared !== null && eligibleDeclared !== eligibleTargets.length) {
    console.log(
      'POPULATION_LIST_GREW',
      JSON.stringify({
        writtenAgainst: eligibleDeclared,
        productionNow: eligibleTargets.length,
        note: 'matched by key, so the new rows are simply undrafted',
      }),
    )
  }

  const authored = new Map<string, string[]>()

  for (const [index, target] of publishTargets.entries()) {
    const item = payload[index]!
    const key = populationTargetKey(target.type, target.id)

    const shape = populationShapeFor(target.type)
    if (item.shape !== shape) {
      throw new Error(`${key}: expected ${shape}, packet says ${item.shape}.`)
    }
    if (item.speakers.length !== populationSpeakerCount(shape)) {
      throw new Error(
        `${key}: ${shape} needs ${populationSpeakerCount(shape)} speaker(s), got ${item.speakers.length}.`,
      )
    }

    // The reply slot is the object answering. Both kinds are valid first-party
    // authors, so a wrong speaker here would insert cleanly and read as nonsense.
    const self = populationSelfSpeaker(target.type, target.id)
    if (self) {
      const reply = item.speakers[1]!
      if (speakerKey(reply) !== speakerKey(self)) {
        throw new Error(
          `${key}: reply must be ${self.kind}:${self.id} answering for itself, got ${reply.kind}:${reply.id}.`,
        )
      }
      if (speakerKey(item.speakers[0]!) === speakerKey(self)) {
        throw new Error(`${key}: the object cannot be its own visitor.`)
      }
    }

    for (const speaker of item.speakers) {
      const directory = authors.get(speakerKey(speaker))
      if (!directory) throw new Error(`${key}: unknown author ${speaker.kind}:${speaker.id}.`)
      if (directory.name !== speaker.name) {
        throw new Error(
          `${key}: author name drift for ${speaker.kind}:${speaker.id}: production says ${directory.name}, packet says ${speaker.name}.`,
        )
      }
      validateFreshness(speaker, directory.sampleResponse, authored)
    }
  }

  console.log(
    'POPULATION_VALIDATED',
    JSON.stringify({
      publishingTargets: publishTargets.length,
      eligibleTargets: eligibleTargets.length,
      alreadyCommented: existing.size,
      publisher,
    }),
  )

  // Every check above reads production and writes nothing, so a dry run is the
  // real pre-flight rather than a simulation of one: it proves the packets agree
  // with live state, then stops on the line before the first insert.
  if (DRY_RUN) {
    const wouldPublish = publishTargets.filter(
      (target) => !existing.has(populationTargetKey(target.type, target.id)),
    )
    console.log(
      'POPULATION_DRY_RUN',
      JSON.stringify({
        validated: publishTargets.length,
        wouldPublishTargets: wouldPublish.length,
        wouldPublishComments: wouldPublish.reduce((sum, target) => {
          const index = publishTargets.indexOf(target)
          return sum + (payload[index]?.speakers.length || 0)
        }, 0),
        wouldSkipTargets: publishTargets.length - wouldPublish.length,
      }),
    )
    return
  }

  let publishedTargets = 0
  let publishedComments = 0
  let skippedTargets = 0

  for (const [index, target] of publishTargets.entries()) {
    const item = payload[index]!
    const key = populationTargetKey(target.type, target.id)
    if (existing.has(key)) {
      skippedTargets += 1
      continue
    }

    const data: Prisma.ReactionCreateManyInput[] = item.speakers.map((speaker) => {
      const author = {
        authorBotId: speaker.kind === 'BOT' ? speaker.id : null,
        authorCharacterId: speaker.kind === 'CHARACTER' ? speaker.id : null,
      }
      assertSingleFirstPartyReactionAuthor(author)
      return {
        userId: publisher.id,
        reactionType: ReactionType.NEUTRAL,
        reactionCategory: CATEGORY[target.type],
        rating: 0,
        comment: speaker.comment.trim(),
        [COLUMN[target.type]]: target.id,
        ...author,
      } as Prisma.ReactionCreateManyInput
    })

    // One statement: no half exchanges.
    const result = await prisma.reaction.createMany({ data })
    if (result.count !== data.length) {
      throw new Error(`${key}: inserted ${result.count}/${data.length}; stopping.`)
    }
    existing.add(key)
    publishedTargets += 1
    publishedComments += result.count

    if (publishedTargets % 25 === 0) {
      console.log(
        'POPULATION_PROGRESS',
        JSON.stringify({ publishedTargets, publishedComments, target: key }),
      )
    }
  }

  const remaining = publishTargets.filter(
    (target) => !existing.has(populationTargetKey(target.type, target.id)),
  )
  if (remaining.length) {
    throw new Error(
      `Ended with ${remaining.length} target(s) in the published slice empty.`,
    )
  }

  console.log(
    'POPULATION_COMPLETE',
    JSON.stringify({
      eligibleTargets: eligibleTargets.length,
      publishedSlice: publishTargets.length,
      undrafted: eligibleTargets.length - publishTargets.length,
      publishedTargets,
      publishedComments,
      skippedTargets,
    }),
  )
}

await main()
