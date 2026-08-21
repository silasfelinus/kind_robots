// /server/api/model-builder/items/[id]/commit.post.ts
// Execute the approved COMMIT for a build item as an idempotent durable write.
import { createError, defineEventHandler, readBody } from 'h3'
import { coerceCardTheme } from '~/utils/entityTheme'
import type {
  DreamType,
  Rarity,
  RewardType,
} from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  assertRunAccess,
  assertRunWritable,
  getItemId,
  parseStoredJson,
} from '../../runs/index'
import { assertArtImageAttachable } from '../../relations'
import {
  CREATE_TARGETS,
  fieldSpecFor,
  parseFieldLines as splitFieldBlob,
} from '~/stores/helpers/modelBuilderFields'
import { BUILD_STAGES } from '~/stores/helpers/modelBuilderRecipes'
import { syncCharacterFacetsInTransaction } from '~/server/utils/characterFacetSync'
import { syncBotFacetsInTransaction } from '~/server/utils/botFacetSync'
import type { FacetTaxonomy } from '~/server/utils/facetCatalog'
import {
  buildFacetProfileCreateData,
  buildFacetProfileUpdateData,
  normalizeFacetTaxonomy,
} from '~/server/utils/facetProfileInput'
import { userIsAdmin } from '../../../../utils/authUser'

type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0]

type SourceType =
  'Project' | 'Character' | 'Bot' | 'Facet' | 'Dream' | 'Reward' | 'Scenario'

type SyncOptions = { userId: number; isAdmin: boolean }

function isSourceType(value: string): value is SourceType {
  return [
    'Project',
    'Character',
    'Bot',
    'Facet',
    'Dream',
    'Reward',
    'Scenario',
  ].includes(value)
}

const LONG_TEXT_MAX = 20000
const DEFAULT_TEXT_MAX = 256
// Explicit per-field caps for columns narrower than LONG_TEXT_MAX/
// DEFAULT_TEXT_MAX -- checked first in pickText below regardless of a
// field's `prose`/LONG_TEXT_FIELDS classification (model-builder/t-029,
// cycle 33): every one of these fields maps to a bounded VarChar column in
// prisma/schema.prisma, so its cap here must match that column's declared
// width, not the prose-text default of 20000 chars.
const SHORT_TEXT_MAX: Partial<Record<SourceType, Record<string, number>>> = {
  Character: { class: 764, species: 764 },
  // description/personality/botIntro/userIntro/prompt: Bot.description and
  // Bot.personality are VarChar(764); Bot.botIntro is VarChar(3000) and
  // NOT NULL; Bot.userIntro and Bot.prompt are VarChar(764) and NOT NULL.
  // All five are marked `prose: true` (or, for personality, simply lacked
  // any override) in MODEL_FIELDS.Bot, which -- before this fix -- let
  // pickText's isLongText branch return LONG_TEXT_MAX (20000) unconditionally
  // for the four prose ones, or the generic DEFAULT_TEXT_MAX (256) for
  // personality, both silently ignoring the real column width. Committing an
  // AI-drafted or user-typed value past these caps risked either a silent
  // MySQL truncation or a "Data too long for column" write failure on the
  // three NOT NULL columns -- for a live, reachable path: Bot is a real
  // CREATE target via the expand-narrator-bot/expand-manager-bot outputs.
  Bot: {
    subtitle: 764,
    description: 764,
    personality: 764,
    botIntro: 3000,
    userIntro: 764,
    prompt: 764,
  },
  Reward: { flavorText: 512, collection: 764 },
  Dream: { flavorText: 512 },
}
const LONG_TEXT_FIELDS: Partial<Record<SourceType, Set<string>>> = {
  Dream: new Set(['examples']),
  Scenario: new Set(['locations', 'inspirations']),
  Facet: new Set(['examples']),
}
const NUMERIC_FIELDS: Partial<Record<SourceType, Set<string>>> = {
  Scenario: new Set(['difficulty']),
}
// name/title column widths per live CREATE target (prisma/schema.prisma).
// The record name/title is never `prose`-classified in MODEL_FIELDS, so it
// falls outside pickText/SHORT_TEXT_MAX entirely -- this file previously
// applied one flat 255-char cap to every target regardless of its actual
// column width. That overshoots Scenario.title, which is `String` with no
// `@db.VarChar` override and therefore Prisma's MySQL default of
// VARCHAR(191) NOT NULL (confirmed in
// prisma/migrations/00000000000000_squashed/migration.sql). A Scenario
// title of 192-255 chars -- reachable via the batch editor's "Set a field
// on all N" or the per-item fieldsDraft textarea, neither of which has a
// maxlength -- passed the old cap untouched and failed the whole commit
// transaction at INSERT time ("Data too long for column 'title'" in MySQL
// strict mode, or a silent truncation otherwise): the same drift class
// SHORT_TEXT_MAX exists to prevent (cycle 33), just reached through a field
// that classification never covers. Character/Reward/Bot.name are all
// VARCHAR(256), so 255 remains correct for them; 255 stays the fallback for
// any future CREATE_TARGETS entry not listed here.
const NAME_MAX: Partial<Record<SourceType, number>> = {
  Character: 256,
  Reward: 256,
  Bot: 256,
  Scenario: 191,
}

// Delegates the actual line-splitting to the shared, schema-aware splitter
// in modelBuilderFields.ts (used by the client too) rather than maintaining
// a second hand-written copy of the same "key: value" parsing here -- two
// copies of this exact logic previously drifted in lockstep only by luck,
// and neither one preserved a multi-line prose value past its first line
// (see parseFieldLines' doc comment there for the full story). modelType is
// the item's own resolved target model (CREATE_TARGETS[outputKey] for
// CREATE, the run's sourceType for UPDATE/ASSET_ONLY) so a stray colon
// inside prose text isn't mistaken for a new field boundary.
function parseFieldLines(
  raw: string | null | undefined,
  modelType: SourceType,
): Record<string, string> {
  const map: Record<string, string> = {}
  if (!raw) return map
  for (const { key, value } of splitFieldBlob(raw, modelType)) {
    const normalizedKey = key.toLowerCase()
    if (normalizedKey && value) map[normalizedKey] = value
  }
  return map
}

function choicesFor(type: SourceType, key: string): string[] | undefined {
  return fieldSpecFor(type).find((field) => field.key === key)?.choices
}

function pickChoice<T extends string>(
  fields: Record<string, string>,
  type: SourceType,
  key: string,
): T | undefined {
  const raw = fields[key.toLowerCase()]
  const choices = choicesFor(type, key)
  if (!raw || !choices) return undefined
  const upper = raw.trim().toUpperCase()
  return choices.includes(upper) ? (upper as T) : undefined
}

/*
 * THEME IS NOT pickChoice. That helper upper-cases before matching, which is
 * right for enum-shaped fields (RARITY, REWARD_TYPES) and wrong here -- daisyUI
 * theme names are lowercase, so every one of them would fail the membership
 * test and silently vanish.
 *
 * Absent or unrecognised becomes a random valid theme rather than nothing:
 * Silas, 2026-08-10, "It's more important to populate with something than to
 * make a precise match."
 */
function pickTheme(fields: Record<string, string>): string {
  return coerceCardTheme(fields.theme)
}

function pickText(
  fields: Record<string, string>,
  type: SourceType,
  key: string,
): string | undefined {
  const raw = fields[key.toLowerCase()]
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  const isLongText =
    fieldSpecFor(type).find((field) => field.key === key)?.prose ||
    LONG_TEXT_FIELDS[type]?.has(key)
  // SHORT_TEXT_MAX is checked FIRST, unconditionally -- not only when
  // `!isLongText` (model-builder/t-029, cycle 33). Before this fix, a field
  // marked `prose: true` (or listed in LONG_TEXT_FIELDS) always took the
  // isLongText branch and got LONG_TEXT_MAX (20000) regardless of any
  // SHORT_TEXT_MAX entry for it, silently making that entry dead code. That
  // exact gap left Reward.flavorText and Dream.flavorText -- both real
  // VarChar(512) columns, both marked prose: true, both already listed in
  // SHORT_TEXT_MAX at 512 -- free to accept up to 20000 characters at
  // commit time, risking a silent MySQL truncation or a "Data too long for
  // column" write failure. An explicit SHORT_TEXT_MAX entry is a narrower,
  // more specific fact about the real schema column than the generic
  // prose/long-text classification, so it must win regardless of that flag.
  const maxLen =
    SHORT_TEXT_MAX[type]?.[key] ??
    (isLongText ? LONG_TEXT_MAX : DEFAULT_TEXT_MAX)
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed
}

function pickInt(
  fields: Record<string, string>,
  key: string,
): number | undefined {
  const raw = fields[key.toLowerCase()]
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

interface CharacterExtra {
  class?: string
  species?: string
  honorific?: string
  personality?: string
  quirks?: string
  backstory?: string
  charm?: Rarity
  empathy?: Rarity
  grace?: Rarity
  luck?: Rarity
  might?: Rarity
  wits?: Rarity
  theme?: string
}

function characterFields(fields: Record<string, string>): CharacterExtra {
  const data: CharacterExtra = {}
  const cls = pickText(fields, 'Character', 'class')
  if (cls) data.class = cls
  const species = pickText(fields, 'Character', 'species')
  if (species) data.species = species
  const honorific = pickText(fields, 'Character', 'honorific')
  if (honorific) data.honorific = honorific
  const personality = pickText(fields, 'Character', 'personality')
  if (personality) data.personality = personality
  const quirks = pickText(fields, 'Character', 'quirks')
  if (quirks) data.quirks = quirks
  const backstory = pickText(fields, 'Character', 'backstory')
  if (backstory) data.backstory = backstory
  const charm = pickChoice<Rarity>(fields, 'Character', 'charm')
  if (charm) data.charm = charm
  const empathy = pickChoice<Rarity>(fields, 'Character', 'empathy')
  if (empathy) data.empathy = empathy
  const grace = pickChoice<Rarity>(fields, 'Character', 'grace')
  if (grace) data.grace = grace
  const luck = pickChoice<Rarity>(fields, 'Character', 'luck')
  if (luck) data.luck = luck
  const might = pickChoice<Rarity>(fields, 'Character', 'might')
  if (might) data.might = might
  const wits = pickChoice<Rarity>(fields, 'Character', 'wits')
  if (wits) data.wits = wits
  data.theme = pickTheme(fields)
  return data
}

interface BotExtra {
  BotType?: string
  subtitle?: string
  description?: string
  personality?: string
  botIntro?: string
  userIntro?: string
  prompt?: string
  theme?: string
}

function botFields(fields: Record<string, string>): BotExtra {
  const data: BotExtra = {}
  const botType = pickChoice<string>(fields, 'Bot', 'botType')
  if (botType) data.BotType = botType
  const subtitle = pickText(fields, 'Bot', 'subtitle')
  if (subtitle) data.subtitle = subtitle
  const description = pickText(fields, 'Bot', 'description')
  if (description) data.description = description
  const personality = pickText(fields, 'Bot', 'personality')
  if (personality) data.personality = personality
  const botIntro = pickText(fields, 'Bot', 'botIntro')
  if (botIntro) data.botIntro = botIntro
  const userIntro = pickText(fields, 'Bot', 'userIntro')
  if (userIntro) data.userIntro = userIntro
  const prompt = pickText(fields, 'Bot', 'prompt')
  if (prompt) data.prompt = prompt
  data.theme = pickTheme(fields)
  return data
}

interface RewardExtra {
  rewardType?: RewardType
  rarity?: Rarity
  effect?: string
  description?: string
  flavorText?: string
  collection?: string
  theme?: string
}

function rewardFields(fields: Record<string, string>): RewardExtra {
  const data: RewardExtra = {}
  const rewardType = pickChoice<RewardType>(fields, 'Reward', 'rewardType')
  if (rewardType) data.rewardType = rewardType
  const rarity = pickChoice<Rarity>(fields, 'Reward', 'rarity')
  if (rarity) data.rarity = rarity
  const effect = pickText(fields, 'Reward', 'effect')
  if (effect) data.effect = effect
  const description = pickText(fields, 'Reward', 'description')
  if (description) data.description = description
  const flavorText = pickText(fields, 'Reward', 'flavorText')
  if (flavorText) data.flavorText = flavorText
  const collection = pickText(fields, 'Reward', 'collection')
  if (collection) data.collection = collection
  data.theme = pickTheme(fields)
  return data
}

interface DreamExtra {
  dreamType?: DreamType
  pitch?: string
  description?: string
  flavorText?: string
  examples?: string
  theme?: string
}

function dreamFields(fields: Record<string, string>): DreamExtra {
  const data: DreamExtra = {}
  const dreamType = pickChoice<DreamType>(fields, 'Dream', 'dreamType')
  if (dreamType) data.dreamType = dreamType
  const pitch = pickText(fields, 'Dream', 'pitch')
  if (pitch) data.pitch = pitch
  const description = pickText(fields, 'Dream', 'description')
  if (description) data.description = description
  const flavorText = pickText(fields, 'Dream', 'flavorText')
  if (flavorText) data.flavorText = flavorText
  const examples = pickText(fields, 'Dream', 'examples')
  if (examples) data.examples = examples
  data.theme = pickTheme(fields)
  return data
}

interface ScenarioExtra {
  description?: string
  intros?: string
  difficulty?: number
  locations?: string
  inspirations?: string
  theme?: string
}

function scenarioFields(fields: Record<string, string>): ScenarioExtra {
  const data: ScenarioExtra = {}
  const description = pickText(fields, 'Scenario', 'description')
  if (description) data.description = description
  const intros = pickText(fields, 'Scenario', 'intros')
  if (intros) data.intros = intros
  const difficulty = NUMERIC_FIELDS.Scenario?.has('difficulty')
    ? pickInt(fields, 'difficulty')
    : undefined
  if (difficulty !== undefined) data.difficulty = difficulty
  const locations = pickText(fields, 'Scenario', 'locations')
  if (locations) data.locations = locations
  const inspirations = pickText(fields, 'Scenario', 'inspirations')
  if (inspirations) data.inspirations = inspirations
  data.theme = pickTheme(fields)
  return data
}

interface ProjectExtra {
  description?: string
  pitch?: string
  goal?: string
}

function projectFields(fields: Record<string, string>): ProjectExtra {
  const data: ProjectExtra = {}
  const description = pickText(fields, 'Project', 'description')
  if (description) data.description = description
  const pitch = pickText(fields, 'Project', 'pitch')
  if (pitch) data.pitch = pitch
  const goal = pickText(fields, 'Project', 'goal')
  if (goal) data.goal = goal
  return data
}

interface FacetExtra {
  taxonomy?: FacetTaxonomy
  description?: string
  examples?: string
  theme?: string
}

function facetFields(fields: Record<string, string>): FacetExtra {
  const data: FacetExtra = {}
  const taxonomy = pickChoice<FacetTaxonomy>(fields, 'Facet', 'taxonomy')
  if (taxonomy) data.taxonomy = normalizeFacetTaxonomy(taxonomy)
  const description = pickText(fields, 'Facet', 'description')
  if (description) data.description = description
  const examples = pickText(fields, 'Facet', 'examples')
  if (examples) data.examples = examples
  data.theme = pickTheme(fields)
  return data
}

function facetTextFields(
  fields: Record<string, string>,
): Omit<FacetExtra, 'taxonomy'> {
  const { taxonomy: _taxonomy, ...textFields } = facetFields(fields)
  return textFields
}

function extraFieldKeys(
  type: SourceType,
  fields: Record<string, string>,
): string[] {
  switch (type) {
    case 'Character':
      return Object.keys(characterFields(fields))
    case 'Bot':
      return Object.keys(botFields(fields))
    case 'Reward':
      return Object.keys(rewardFields(fields))
    case 'Dream':
      return Object.keys(dreamFields(fields))
    case 'Scenario':
      return Object.keys(scenarioFields(fields))
    case 'Project':
      return Object.keys(projectFields(fields))
    case 'Facet':
      return Object.keys(facetFields(fields))
  }
}

async function promoteAsset(
  type: SourceType,
  id: number,
  artImageId: number,
): Promise<void> {
  switch (type) {
    case 'Project':
      await prisma.project.update({ where: { id }, data: { artImageId } })
      return
    case 'Character':
      await prisma.character.update({ where: { id }, data: { artImageId } })
      return
    case 'Bot':
      await prisma.bot.update({ where: { id }, data: { artImageId } })
      return
    case 'Facet':
      await prisma.facet.update({ where: { id }, data: { artImageId } })
      return
    case 'Dream':
      await prisma.dream.update({ where: { id }, data: { artImageId } })
      return
    case 'Reward':
      await prisma.reward.update({ where: { id }, data: { artImageId } })
      return
    case 'Scenario':
      await prisma.scenario.update({ where: { id }, data: { artImageId } })
      return
  }
}

async function syncFacetProfileUpdate(
  tx: TransactionClient,
  id: number,
  fields: Record<string, string>,
): Promise<void> {
  const [facet, existingProfile] = await Promise.all([
    tx.facet.findUnique({ where: { id }, select: { title: true } }),
    tx.facetProfile.findUnique({
      where: { facetId: id },
      select: { taxonomy: true },
    }),
  ])
  if (!facet)
    throw createError({ statusCode: 404, message: `Facet #${id} not found.` })

  const requestedTaxonomy = facetFields(fields).taxonomy

  // Two UPDATE-type build runs can target the same existing Facet at once
  // (nothing serializes runs by sourceId -- see runs/index.post.ts). If both
  // reach COMMIT while `existingProfile` is still null for both reads, a
  // plain create-if-missing here lets the second transaction's
  // facetProfile.create() throw a `facetId` unique-constraint violation,
  // which aborts this *entire* commit transaction -- rolling back the
  // sibling tx.facet.update() above along with it, and surfacing as an
  // opaque 500 to whichever request loses the race. facetProfile.upsert()
  // resolves the create-vs-update decision atomically at the database (a
  // single INSERT ... ON DUPLICATE KEY UPDATE on MySQL), so the loser
  // applies its own intended taxonomy as an update instead of crashing.
  if (!existingProfile) {
    const taxonomy = requestedTaxonomy ?? 'OTHER'
    const createData = buildFacetProfileCreateData(
      { taxonomy },
      { title: facet.title, taxonomy },
    )
    await tx.facetProfile.upsert({
      where: { facetId: id },
      create: { facetId: id, ...createData },
      update: requestedTaxonomy
        ? buildFacetProfileUpdateData(
            { taxonomy: requestedTaxonomy },
            { title: facet.title, taxonomy },
          )
        : {},
    })
    return
  }

  if (requestedTaxonomy) {
    const profile = buildFacetProfileUpdateData(
      { taxonomy: requestedTaxonomy },
      {
        title: facet.title,
        taxonomy: normalizeFacetTaxonomy(existingProfile.taxonomy, 'OTHER'),
      },
    )
    await tx.facetProfile.update({ where: { facetId: id }, data: profile })
  }
}

async function updateText(
  tx: TransactionClient,
  type: SourceType,
  id: number,
  text: string,
  fields: Record<string, string>,
  syncOptions: SyncOptions,
): Promise<void> {
  switch (type) {
    case 'Project':
      await tx.project.update({
        where: { id },
        data: { pitch: text, ...projectFields(fields) },
      })
      return
    case 'Character': {
      const character = await tx.character.update({
        where: { id },
        data: { backstory: text, ...characterFields(fields) },
      })
      await syncCharacterFacetsInTransaction(tx, character, syncOptions)
      return
    }
    case 'Bot': {
      const bot = await tx.bot.update({
        where: { id },
        data: { description: text, ...botFields(fields) },
      })
      await syncBotFacetsInTransaction(tx, bot, syncOptions)
      return
    }
    case 'Facet': {
      await tx.facet.update({
        where: { id },
        data: {
          description: text,
          ...facetTextFields(fields),
        },
      })
      await syncFacetProfileUpdate(tx, id, fields)
      return
    }
    case 'Dream':
      await tx.dream.update({
        where: { id },
        data: { pitch: text, ...dreamFields(fields) },
      })
      return
    case 'Reward':
      await tx.reward.update({
        where: { id },
        data: { description: text, ...rewardFields(fields) },
      })
      return
    case 'Scenario':
      await tx.scenario.update({
        where: { id },
        data: { description: text, ...scenarioFields(fields) },
      })
      return
  }
}

async function createRecord(
  tx: TransactionClient,
  type: SourceType,
  name: string,
  text: string,
  fields: Record<string, string>,
  userId: number,
  syncOptions: SyncOptions,
): Promise<number> {
  const priv = { userId, isPublic: false, isActive: false }
  switch (type) {
    case 'Character': {
      const character = await tx.character.create({
        data: { name, backstory: text, ...priv, ...characterFields(fields) },
      })
      await syncCharacterFacetsInTransaction(tx, character, syncOptions)
      return character.id
    }
    case 'Reward':
      return (
        await tx.reward.create({
          data: { name, description: text, ...priv, ...rewardFields(fields) },
        })
      ).id
    case 'Scenario':
      return (
        await tx.scenario.create({
          data: {
            title: name,
            description: text || name,
            intros: '',
            ...priv,
            ...scenarioFields(fields),
          },
        })
      ).id
    case 'Dream':
      return (
        await tx.dream.create({
          data: { title: name, pitch: text, ...priv, ...dreamFields(fields) },
        })
      ).id
    case 'Project':
      return (
        await tx.project.create({
          data: { title: name, pitch: text, ...priv, ...projectFields(fields) },
        })
      ).id
    case 'Facet': {
      const extra = facetFields(fields)
      const taxonomy = extra.taxonomy ?? 'OTHER'
      const facet = await tx.facet.create({
        data: {
          title: name,
          description: text,
          ...priv,
          ...facetTextFields(fields),
        },
      })
      const profile = buildFacetProfileCreateData(
        { taxonomy },
        { title: name, taxonomy },
      )
      await tx.facetProfile.create({ data: { facetId: facet.id, ...profile } })
      return facet.id
    }
    case 'Bot': {
      const extra = botFields(fields)
      const bot = await tx.bot.create({
        data: {
          name,
          description: text,
          BotType: extra.BotType ?? 'CHATBOT',
          botIntro: extra.botIntro ?? (text || name),
          userIntro: extra.userIntro ?? 'Hello!',
          prompt: extra.prompt ?? (text || name),
          ...priv,
          ...extra,
        },
      })
      await syncBotFacetsInTransaction(tx, bot, syncOptions)
      return bot.id
    }
    default:
      throw createError({
        statusCode: 400,
        message: `Cannot create a ${type as string}.`,
      })
  }
}

async function linkSourceToTarget(
  tx: TransactionClient,
  sourceType: SourceType,
  sourceId: number,
  targetType: SourceType,
  targetId: number,
): Promise<boolean> {
  if (sourceType === 'Dream' && targetType === 'Character') {
    await tx.dream.update({
      where: { id: sourceId },
      data: { Characters: { connect: { id: targetId } } },
    })
    return true
  }
  if (sourceType === 'Dream' && targetType === 'Reward') {
    await tx.dream.update({
      where: { id: sourceId },
      data: { Rewards: { connect: { id: targetId } } },
    })
    return true
  }
  if (sourceType === 'Dream' && targetType === 'Scenario') {
    await tx.dream.update({
      where: { id: sourceId },
      data: { Scenarios: { connect: { id: targetId } } },
    })
    return true
  }
  if (sourceType === 'Project' && targetType === 'Bot') {
    await tx.project.update({
      where: { id: sourceId },
      data: { managerBotId: targetId },
    })
    return true
  }
  if (sourceType === 'Dream' && targetType === 'Bot') {
    await tx.dream.update({
      where: { id: sourceId },
      data: { narratorId: targetId },
    })
    return true
  }
  if (sourceType === 'Character' && targetType === 'Reward') {
    await tx.character.update({
      where: { id: sourceId },
      data: { Rewards: { connect: { id: targetId } } },
    })
    return true
  }
  if (sourceType === 'Reward' && targetType === 'Character') {
    await tx.reward.update({
      where: { id: sourceId },
      data: { Characters: { connect: { id: targetId } } },
    })
    return true
  }
  if (sourceType === 'Scenario' && targetType === 'Character') {
    await tx.scenario.update({
      where: { id: sourceId },
      data: { Characters: { connect: { id: targetId } } },
    })
    return true
  }
  if (sourceType === 'Character' && targetType === 'Scenario') {
    await tx.character.update({
      where: { id: sourceId },
      data: { Scenarios: { connect: { id: targetId } } },
    })
    return true
  }
  return false
}

interface CommitTarget {
  type: SourceType
  id: number
  created: boolean
  linked?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const id = getItemId(event)
    const auth = await requireApiUser(event)
    const body = await readBody<{ dryRun?: boolean }>(event)
    const dryRun = body?.dryRun === true
    const syncOptions: SyncOptions = {
      userId: auth.user.id,
      isAdmin: userIsAdmin(auth.user),
    }

    const item = await prisma.modelBuildItem.findUnique({
      where: { id },
      include: {
        Run: {
          select: {
            userId: true,
            sourceType: true,
            sourceId: true,
            status: true,
          },
        },
      },
    })
    if (!item) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: 'Build item not found.',
        statusCode: 404,
      }
    }
    assertRunAccess(item.Run, auth.user)
    assertRunWritable(item.Run)

    // The front-end only ever calls commitItem() once COMMIT has unlocked,
    // which approveStage only does after PITCH, FIELDS_AND_PROMPTS, and
    // GENERATE_ASSETS are each approved in turn — but that sequencing lives
    // entirely in the client state machine. This route trusted the client to
    // have gotten there, so a direct POST (bad client state, a retried/
    // replayed request, or just curl) for an item still sitting at 'locked'/
    // 'ready'/'rejected' could create/update/promote straight from an
    // unreviewed draft — the exact "silently rewrites a canonical model"
    // outcome this module's own header comment says COMMIT must never cause.
    // dryRun previews the plan without writing, so it's exempt.
    if (!dryRun) {
      const currentStages = parseStoredJson<
        Record<string, { status?: string }>
      >(item.stageStatuses, {})
      const unapprovedStage = BUILD_STAGES.find(
        (stage) =>
          stage.key !== 'COMMIT' &&
          currentStages[stage.key]?.status !== 'approved',
      )
      if (unapprovedStage) {
        throw createError({
          statusCode: 400,
          message: `${unapprovedStage.label} must be approved before committing.`,
        })
      }
    }

    const sourceType = item.Run.sourceType
    if (!isSourceType(sourceType)) {
      throw createError({
        statusCode: 400,
        message: `Unsupported source type "${sourceType}".`,
      })
    }
    const sourceId = item.Run.sourceId
    const text = (item.pitch || item.fieldsDraft || '').trim()
    // ASSET_ONLY/UPDATE write onto the run's own source record; CREATE writes
    // a different, mapped target model instead (see the `plan` branches
    // below). Resolved here too so the FIELDS_AND_PROMPTS blob is split
    // against the model it's actually destined for.
    const fieldModelType: SourceType =
      item.action === 'CREATE'
        ? (CREATE_TARGETS[item.outputKey] ?? sourceType)
        : sourceType
    const fieldMap = parseFieldLines(item.fieldsDraft, fieldModelType)
    // Every CREATE target's field spec declares a required 'name' or 'title'
    // line (see MODEL_FIELDS in modelBuilderFields.ts) that the batch editor
    // and per-item panel both surface as the record's actual name/title. Honor
    // whatever the user (or AI drafter) put there before falling back to the
    // pitch's first line -- otherwise a deliberately-typed name is silently
    // discarded in favor of pitch text on commit. The cap is per-target width
    // (NAME_MAX) rather than one flat number -- see NAME_MAX's comment.
    const name = (
      fieldMap.name ||
      fieldMap.title ||
      item.pitch?.split('\n')[0]?.trim() ||
      item.label ||
      'Untitled'
    ).slice(0, NAME_MAX[fieldModelType] ?? 255)

    if (item.idempotencyKey) {
      return {
        success: true,
        message: 'Item was already committed.',
        data: {
          alreadyCommitted: true,
          target:
            item.targetType && item.targetId
              ? { type: item.targetType, id: item.targetId }
              : null,
        },
        statusCode: 200,
      }
    }

    let plan:
      | {
          action: 'ASSET_ONLY'
          targetType: SourceType
          targetId: number
          field: string
          value: number
        }
      | {
          action: 'UPDATE'
          targetType: SourceType
          targetId: number
          field: string
          value: string
          fields: string[]
        }
      | {
          action: 'CREATE'
          targetType: SourceType
          name: string
          text: string
          fields: string[]
        }

    if (item.action === 'ASSET_ONLY') {
      if (!item.artImageId) {
        throw createError({
          statusCode: 400,
          message: 'Generate and keep an asset before committing.',
        })
      }
      plan = {
        action: 'ASSET_ONLY',
        targetType: sourceType,
        targetId: sourceId,
        field: 'artImageId',
        value: item.artImageId,
      }
    } else if (item.action === 'UPDATE') {
      if (!text) {
        throw createError({
          statusCode: 400,
          message: 'Add pitch/field text before committing an update.',
        })
      }
      plan = {
        action: 'UPDATE',
        targetType: sourceType,
        targetId: sourceId,
        field: 'text',
        value: text,
        fields: extraFieldKeys(sourceType, fieldMap),
      }
    } else {
      const targetType = CREATE_TARGETS[item.outputKey]
      if (!targetType) {
        throw createError({
          statusCode: 400,
          message: `Commit for "${item.outputKey}" is not supported yet.`,
        })
      }
      plan = {
        action: 'CREATE',
        targetType,
        name,
        text,
        fields: extraFieldKeys(targetType, fieldMap),
      }
    }

    if (dryRun) {
      return {
        success: true,
        message: 'Commit plan (dry run).',
        data: { alreadyCommitted: false, dryRun: true, plan },
        statusCode: 200,
      }
    }

    const claim = await prisma.modelBuildItem.updateMany({
      where: { id, idempotencyKey: null },
      data: { idempotencyKey: `commit:${id}` },
    })
    if (claim.count === 0) {
      const fresh = await prisma.modelBuildItem.findUnique({
        where: { id },
        select: { targetType: true, targetId: true },
      })
      return {
        success: true,
        message: 'Item was already committed.',
        data: {
          alreadyCommitted: true,
          target:
            fresh?.targetType && fresh?.targetId
              ? { type: fresh.targetType, id: fresh.targetId }
              : null,
        },
        statusCode: 200,
      }
    }

    let target: CommitTarget
    try {
      if (plan.action === 'ASSET_ONLY') {
        // assertArtImageAttachable was already checked once, when this
        // artImageId was first attached to the item (items/[id].patch.ts,
        // items/batch.patch.ts) — but an item can sit approved for an
        // arbitrary stretch between that attach and this COMMIT (nothing
        // requires committing right away). If the ArtImage's owner flips it
        // private (or an admin/owner action changes who may attach it) in
        // that window, the earlier check no longer reflects reality, and
        // promoteAsset below writes the FK onto the source record's
        // canonical art link regardless — exactly the "surfaces a private
        // ArtImage through another record's canonical art" outcome
        // relations.ts's own header comment says this guard exists to
        // prevent. Re-checking here, immediately before the privileged
        // write, closes that gap the same way this route already re-reads
        // stageStatuses immediately before its own final write below.
        await assertArtImageAttachable(
          plan.value,
          auth.user.id,
          syncOptions.isAdmin,
        )
        await promoteAsset(sourceType, sourceId, plan.value)
        target = { type: sourceType, id: sourceId, created: false }
      } else if (plan.action === 'UPDATE') {
        await prisma.$transaction((tx) =>
          updateText(
            tx,
            sourceType,
            sourceId,
            plan.value,
            fieldMap,
            syncOptions,
          ),
        )
        target = { type: sourceType, id: sourceId, created: false }
      } else {
        const targetType = plan.targetType
        const created = await prisma.$transaction(async (tx) => {
          const newId = await createRecord(
            tx,
            targetType,
            name,
            text,
            fieldMap,
            auth.user.id,
            syncOptions,
          )
          const linked = await linkSourceToTarget(
            tx,
            sourceType,
            sourceId,
            targetType,
            newId,
          )
          return { newId, linked }
        })
        target = {
          type: targetType,
          id: created.newId,
          created: true,
          linked: created.linked,
        }
      }
    } catch (writeError) {
      await prisma.modelBuildItem.updateMany({
        where: { id },
        data: { idempotencyKey: null },
      })
      throw writeError
    }

    // Durably persist targetType/targetId in their own minimal write
    // immediately after the primary write succeeds, separate from the
    // slower stageStatuses re-read/merge/write below. Without this, a
    // failure in that later step (e.g. a DB blip) would leave the item
    // permanently claimed -- idempotencyKey is already set above, and must
    // stay set so a retry can't redo the primary write and duplicate it --
    // but with targetType/targetId still null, orphaning the record this
    // commit already produced: every future "already committed" response
    // (both branches above) would report `target: null` forever with no
    // way to recover it. This write's own failure isn't caught/reset either,
    // for the same reason -- the primary write already happened and must
    // not be repeated.
    target = await prisma.modelBuildItem
      .update({
        where: { id },
        data: { targetType: target.type, targetId: target.id },
        select: { targetType: true, targetId: true },
      })
      .then((row) => ({
        type: row.targetType as SourceType,
        id: row.targetId as number,
        created: target.created,
        linked: target.linked,
      }))

    // Re-read stageStatuses immediately before this final write rather than
    // reusing the request-start `item` snapshot: the write above (promote /
    // update / create+link) can be a slow, multi-step transaction, and
    // nothing blocks the client from reopening this item's other stages
    // (PATCH /items/:id) while it's in flight. Building the full
    // stageStatuses blob from a stale snapshot would silently clobber that
    // concurrent edit -- restoring stages to 'approved' that the user just
    // reopened -- so merge the COMMIT key into the current DB value instead.
    // targetType/targetId are already durably persisted above, so this write
    // only needs to carry stageStatuses.
    const latest = await prisma.modelBuildItem.findUnique({
      where: { id },
      select: { stageStatuses: true },
    })
    const stages = parseStoredJson<Record<string, unknown>>(
      latest?.stageStatuses ?? item.stageStatuses,
      {},
    )
    stages.COMMIT = {
      status: 'approved',
      note: `Committed → ${target.type} #${target.id}${target.created ? (target.linked ? ' (created + linked)' : ' (created)') : ''}`,
    }

    const updated = await prisma.modelBuildItem.update({
      where: { id },
      data: {
        stageStatuses: JSON.stringify(stages),
      },
      include: {
        Artifacts: { orderBy: { id: 'asc' } },
        Revisions: { orderBy: { id: 'asc' } },
      },
    })

    return {
      success: true,
      message: `Committed ${plan.action === 'CREATE' ? 'new ' + target.type : target.type + ' #' + target.id}.`,
      data: { alreadyCommitted: false, target, item: updated },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
