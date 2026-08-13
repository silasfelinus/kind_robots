// /utils/scripts/publishNexusComments.ts
//
// The second comment pass: extra voices on the places people pass through.
//
//   npx tsx utils/scripts/publishNexusComments.ts --dry-run
//   npx tsx utils/scripts/publishNexusComments.ts
//
// The population lane gave every object one exchange and skipped any target
// that already had a first-party comment. That skip is exactly what makes it
// useless here, because every target in this pass already has one. So this lane
// needs a different notion of "already done".
//
// IDEMPOTENCY IS ON THE COMMENT TEXT. A comment is written only if no Reaction
// already exists on that target, by that speaker, with that exact body. The
// text is the natural key: two speakers can share a target, one speaker can
// visit a target twice, but the same speaker saying the same sentence twice on
// the same card is always a re-run rather than an intention.
//
// The alternative -- counting comments per target -- would silently do nothing
// on a target whose count had grown for any other reason, and would double-write
// everything on a target somebody had tidied. Text matching has neither failure.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import prisma from '@/server/utils/prisma'
import {
  ReactionType,
  Reaction_reactionCategory,
  type Prisma,
} from '@/prisma/generated/prisma/client'
import { assertSingleFirstPartyReactionAuthor } from '@/utils/reactions/firstPartyReactionAuthor'
import {
  POPULATION_TARGET_TYPES,
  type PopulationTargetType,
} from '@/utils/comments/populationTargets'

const DRY_RUN = process.argv.includes('--dry-run')
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

type NexusSpeaker = {
  kind: 'BOT' | 'CHARACTER'
  id: number
  name: string
  comment: string
}
type NexusItem = {
  targetType: PopulationTargetType
  targetId: number
  targetTitle?: string
  speakers: NexusSpeaker[]
}
type NexusBatch = {
  version: number
  batch: string
  releaseGate: string
  draftingModel?: string
  items: NexusItem[]
}

const dir = join(process.cwd(), 'config', 'nexus-comment-drafts')

function loadItems(): NexusItem[] {
  if (!existsSync(dir)) throw new Error(`No batch directory at ${dir}.`)
  const names = readdirSync(dir).filter((n) => n.endsWith('.json')).sort()
  if (!names.length) throw new Error(`No batch files in ${dir}.`)
  const items: NexusItem[] = []
  for (const name of names) {
    const batch = JSON.parse(readFileSync(join(dir, name), 'utf8')) as NexusBatch
    if (batch.version !== 1) {
      throw new Error(`${name}: unexpected version ${batch.version}.`)
    }
    if (batch.releaseGate !== EXPECTED_RELEASE_GATE) {
      throw new Error(`${name}: unexpected release gate ${batch.releaseGate}.`)
    }
    for (const item of batch.items || []) {
      if (!POPULATION_TARGET_TYPES.includes(item.targetType)) {
        throw new Error(`${name}: unknown target type ${item.targetType}.`)
      }
      if (!item.speakers?.length) {
        throw new Error(`${name}: ${item.targetType}:${item.targetId} has no speakers.`)
      }
      items.push(item)
    }
  }
  return items
}

async function loadTargets(items: readonly NexusItem[]) {
  const idsByType = new Map<PopulationTargetType, number[]>()
  for (const item of items) {
    const list = idsByType.get(item.targetType) || []
    list.push(item.targetId)
    idsByType.set(item.targetType, list)
  }
  const common = { id: true, isPublic: true, allowReviews: true } as const
  // Whole tables, filtered in memory. A large `WHERE id IN (...)` hung the
  // connection lane's dry run for fourteen minutes through ProxySQL; these
  // tables are small enough that reading them all is the cheap option.
  const keep = (type: PopulationTargetType) =>
    new Set(idsByType.get(type) || [])
  const [allBots, allCharacters, allDreams, allScenarios, allProjects] =
    await Promise.all([
      prisma.bot.findMany({ select: { ...common, name: true } }),
      prisma.character.findMany({ select: { ...common, name: true, isActive: true } }),
      prisma.dream.findMany({ select: { ...common, title: true, isActive: true } }),
      prisma.scenario.findMany({ select: { ...common, title: true, isActive: true } }),
      prisma.project.findMany({ select: { ...common, title: true } }),
    ])
  const botKeep = keep('BOT')
  const characterKeep = keep('CHARACTER')
  const bots = allBots.filter((row) => botKeep.has(row.id))
  const characters = allCharacters.filter((row) => characterKeep.has(row.id))
  const dreams = allDreams.filter((row) => keep('DREAM').has(row.id))
  const scenarios = allScenarios.filter((row) => keep('SCENARIO').has(row.id))
  const projects = allProjects.filter((row) => keep('PROJECT').has(row.id))
  const map = new Map<string, { isPublic: boolean; allowReviews: boolean; isActive?: boolean; label: string }>()
  const put = (type: PopulationTargetType, rows: Array<Record<string, unknown>>, labelKey: string) => {
    for (const row of rows) {
      map.set(`${type}:${row.id}`, {
        isPublic: Boolean(row.isPublic),
        allowReviews: row.allowReviews !== false,
        isActive: row.isActive === undefined ? true : Boolean(row.isActive),
        label: String(row[labelKey] ?? ''),
      })
    }
  }
  put('BOT', bots, 'name')
  put('CHARACTER', characters, 'name')
  put('DREAM', dreams, 'title')
  put('SCENARIO', scenarios, 'title')
  put('PROJECT', projects, 'title')
  return map
}

async function main() {
  const items = loadItems()
  const [targets, publisher] = await Promise.all([
    loadTargets(items),
    prisma.user.findUnique({ where: { id: PUBLISHER_USER_ID }, select: { id: true, username: true } }),
  ])
  if (!publisher) throw new Error(`Publisher user #${PUBLISHER_USER_ID} does not exist.`)

  // Author names re-checked against live rows: a renamed speaker whose id still
  // resolves would publish correctly under the wrong name.
  const botIds = [...new Set(items.flatMap((i) => i.speakers.filter((s) => s.kind === 'BOT').map((s) => s.id)))]
  const characterIds = [...new Set(items.flatMap((i) => i.speakers.filter((s) => s.kind === 'CHARACTER').map((s) => s.id)))]
  const botIdSet = new Set(botIds)
  const characterIdSet = new Set(characterIds)
  const [everyBot, everyCharacter] = await Promise.all([
    prisma.bot.findMany({ select: { id: true, name: true } }),
    prisma.character.findMany({ select: { id: true, name: true } }),
  ])
  const speakerBots = everyBot.filter((row) => botIdSet.has(row.id))
  const speakerCharacters = everyCharacter.filter((row) =>
    characterIdSet.has(row.id),
  )
  const speakerName = new Map<string, string>()
  for (const row of speakerBots) speakerName.set(`BOT:${row.id}`, row.name)
  for (const row of speakerCharacters) speakerName.set(`CHARACTER:${row.id}`, row.name)

  for (const item of items) {
    const key = `${item.targetType}:${item.targetId}`
    const target = targets.get(key)
    if (!target) throw new Error(`${key}: target not found.`)
    if (!target.isPublic || target.isActive === false) throw new Error(`${key}: not public/active.`)
    if (!target.allowReviews) throw new Error(`${key}: has reviews turned off.`)

    const seen = new Set<string>()
    for (const speaker of item.speakers) {
      const speakerKey = `${speaker.kind}:${speaker.id}`
      const live = speakerName.get(speakerKey)
      if (!live) throw new Error(`${key}: unknown speaker ${speakerKey}.`)
      if (live !== speaker.name) {
        throw new Error(`${key}: ${speakerKey} is "${live}" in production, packet says "${speaker.name}".`)
      }
      if (seen.has(speakerKey)) throw new Error(`${key}: ${speakerKey} speaks twice in one exchange.`)
      seen.add(speakerKey)

      const comment = speaker.comment.trim()
      const words = comment.split(/\s+/).filter(Boolean).length
      if (words < 4 || words > 120) throw new Error(`${key}/${speakerKey}: ${words} words.`)
      if (comment.length > 1200) throw new Error(`${key}/${speakerKey}: over 1200 chars.`)
      const banned = comment.match(BANNED_REVIEW_LANGUAGE)?.[0]
      if (banned) {
        throw new Error(`${key}/${speakerKey}: banned vocabulary "${banned}".`)
      }
    }
  }

  console.log('NEXUS_VALIDATED', JSON.stringify({ targets: items.length, comments: items.reduce((n, i) => n + i.speakers.length, 0), publisher }))

  let written = 0
  let skipped = 0

  for (const item of items) {
    const column = COLUMN[item.targetType]
    for (const speaker of item.speakers) {
      const comment = speaker.comment.trim()
      // The natural key: this target, this speaker, this exact body.
      const existing = await prisma.reaction.findFirst({
        where: {
          [column]: item.targetId,
          comment,
          ...(speaker.kind === 'BOT'
            ? { authorBotId: speaker.id }
            : { authorCharacterId: speaker.id }),
        } as Prisma.ReactionWhereInput,
        select: { id: true },
      })
      if (existing) {
        skipped += 1
        continue
      }
      if (DRY_RUN) {
        written += 1
        continue
      }
      const author = {
        authorBotId: speaker.kind === 'BOT' ? speaker.id : null,
        authorCharacterId: speaker.kind === 'CHARACTER' ? speaker.id : null,
      }
      assertSingleFirstPartyReactionAuthor(author)
      await prisma.reaction.create({
        data: {
          userId: publisher.id,
          reactionType: ReactionType.NEUTRAL,
          reactionCategory: CATEGORY[item.targetType],
          rating: 0,
          comment,
          [column]: item.targetId,
          ...author,
        } as unknown as Prisma.ReactionUncheckedCreateInput,
      })
      written += 1
    }
  }

  console.log(
    DRY_RUN ? 'NEXUS_DRY_RUN' : 'NEXUS_COMPLETE',
    JSON.stringify({ written, skipped }),
  )
}

await main()
