// /server/api/model-builder/items/[id]/commit.post.ts
// Execute the approved COMMIT for a build item as an idempotent durable write.
import { createError, defineEventHandler, readBody } from 'h3'
import type { DreamType, Rarity, RewardType } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { assertRunAccess, getItemId, parseStoredJson } from '../../runs/index'
import { CREATE_TARGETS, fieldSpecFor } from '~/stores/helpers/modelBuilderFields'
import { syncCharacterFacetsInTransaction } from '~/server/utils/characterFacetSync'
import { syncBotFacetsInTransaction } from '~/server/utils/botFacetSync'
import type { FacetTaxonomy } from '~/server/utils/facetCatalog'
import {
  buildFacetProfileCreateData,
  buildFacetProfileUpdateData,
  legacyFacetKindForTaxonomy,
  normalizeFacetTaxonomy,
} from '~/server/utils/facetProfileInput'

type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0]

type SourceType =
  | 'Project'
  | 'Character'
  | 'Bot'
  | 'Facet'
  | 'Dream'
  | 'Reward'
  | 'Scenario'

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
const SHORT_TEXT_MAX: Partial<Record<SourceType, Record<string, number>>> = {
  Character: { class: 764, species: 764 },
  Bot: { subtitle: 764 },
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

function parseFieldLines(raw: string | null | undefined): Record<string, string> {
  const map: Record<string, string> = {}
  if (!raw) return map
  for (const line of raw.split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim().toLowerCase()
    const value = line.slice(idx + 1).trim()
    if (key && value) map[key] = value
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
  const maxLen = isLongText
    ? LONG_TEXT_MAX
    : (SHORT_TEXT_MAX[type]?.[key] ?? DEFAULT_TEXT_MAX)
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed
}

function pickInt(fields: Record<string, string>, key: string): number | undefined {
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
}

function characterFields(fields: Record<string, string>): CharacterExtra {
  const data: CharacterExtra = {}
  const cls = pickText(fields, 'Character', 'class'); if (cls) data.class = cls
  const species = pickText(fields, 'Character', 'species'); if (species) data.species = species
  const honorific = pickText(fields, 'Character', 'honorific'); if (honorific) data.honorific = honorific
  const personality = pickText(fields, 'Character', 'personality'); if (personality) data.personality = personality
  const quirks = pickText(fields, 'Character', 'quirks'); if (quirks) data.quirks = quirks
  const backstory = pickText(fields, 'Character', 'backstory'); if (backstory) data.backstory = backstory
  const charm = pickChoice<Rarity>(fields, 'Character', 'charm'); if (charm) data.charm = charm
  const empathy = pickChoice<Rarity>(fields, 'Character', 'empathy'); if (empathy) data.empathy = empathy
  const grace = pickChoice<Rarity>(fields, 'Character', 'grace'); if (grace) data.grace = grace
  const luck = pickChoice<Rarity>(fields, 'Character', 'luck'); if (luck) data.luck = luck
  const might = pickChoice<Rarity>(fields, 'Character', 'might'); if (might) data.might = might
  const wits = pickChoice<Rarity>(fields, 'Character', 'wits'); if (wits) data.wits = wits
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
}

function botFields(fields: Record<string, string>): BotExtra {
  const data: BotExtra = {}
  const botType = pickChoice<string>(fields, 'Bot', 'botType'); if (botType) data.BotType = botType
  const subtitle = pickText(fields, 'Bot', 'subtitle'); if (subtitle) data.subtitle = subtitle
  const description = pickText(fields, 'Bot', 'description'); if (description) data.description = description
  const personality = pickText(fields, 'Bot', 'personality'); if (personality) data.personality = personality
  const botIntro = pickText(fields, 'Bot', 'botIntro'); if (botIntro) data.botIntro = botIntro
  const userIntro = pickText(fields, 'Bot', 'userIntro'); if (userIntro) data.userIntro = userIntro
  const prompt = pickText(fields, 'Bot', 'prompt'); if (prompt) data.prompt = prompt
  return data
}

interface RewardExtra {
  rewardType?: RewardType
  rarity?: Rarity
  effect?: string
  description?: string
  flavorText?: string
  collection?: string
}

function rewardFields(fields: Record<string, string>): RewardExtra {
  const data: RewardExtra = {}
  const rewardType = pickChoice<RewardType>(fields, 'Reward', 'rewardType'); if (rewardType) data.rewardType = rewardType
  const rarity = pickChoice<Rarity>(fields, 'Reward', 'rarity'); if (rarity) data.rarity = rarity
  const effect = pickText(fields, 'Reward', 'effect'); if (effect) data.effect = effect
  const description = pickText(fields, 'Reward', 'description'); if (description) data.description = description
  const flavorText = pickText(fields, 'Reward', 'flavorText'); if (flavorText) data.flavorText = flavorText
  const collection = pickText(fields, 'Reward', 'collection'); if (collection) data.collection = collection
  return data
}

interface DreamExtra {
  dreamType?: DreamType
  pitch?: string
  description?: string
  flavorText?: string
  examples?: string
}

function dreamFields(fields: Record<string, string>): DreamExtra {
  const data: DreamExtra = {}
  const dreamType = pickChoice<DreamType>(fields, 'Dream', 'dreamType'); if (dreamType) data.dreamType = dreamType
  const pitch = pickText(fields, 'Dream', 'pitch'); if (pitch) data.pitch = pitch
  const description = pickText(fields, 'Dream', 'description'); if (description) data.description = description
  const flavorText = pickText(fields, 'Dream', 'flavorText'); if (flavorText) data.flavorText = flavorText
  const examples = pickText(fields, 'Dream', 'examples'); if (examples) data.examples = examples
  return data
}

interface ScenarioExtra {
  description?: string
  intros?: string
  difficulty?: number
  locations?: string
  inspirations?: string
}

function scenarioFields(fields: Record<string, string>): ScenarioExtra {
  const data: ScenarioExtra = {}
  const description = pickText(fields, 'Scenario', 'description'); if (description) data.description = description
  const intros = pickText(fields, 'Scenario', 'intros'); if (intros) data.intros = intros
  const difficulty = NUMERIC_FIELDS.Scenario?.has('difficulty') ? pickInt(fields, 'difficulty') : undefined
  if (difficulty !== undefined) data.difficulty = difficulty
  const locations = pickText(fields, 'Scenario', 'locations'); if (locations) data.locations = locations
  const inspirations = pickText(fields, 'Scenario', 'inspirations'); if (inspirations) data.inspirations = inspirations
  return data
}

interface ProjectExtra {
  description?: string
  pitch?: string
  goal?: string
}

function projectFields(fields: Record<string, string>): ProjectExtra {
  const data: ProjectExtra = {}
  const description = pickText(fields, 'Project', 'description'); if (description) data.description = description
  const pitch = pickText(fields, 'Project', 'pitch'); if (pitch) data.pitch = pitch
  const goal = pickText(fields, 'Project', 'goal'); if (goal) data.goal = goal
  return data
}

interface FacetExtra {
  taxonomy?: FacetTaxonomy
  description?: string
  examples?: string
}

function facetFields(fields: Record<string, string>): FacetExtra {
  const data: FacetExtra = {}
  const taxonomy = pickChoice<FacetTaxonomy>(fields, 'Facet', 'taxonomy')
  if (taxonomy) data.taxonomy = normalizeFacetTaxonomy(taxonomy)
  const description = pickText(fields, 'Facet', 'description'); if (description) data.description = description
  const examples = pickText(fields, 'Facet', 'examples'); if (examples) data.examples = examples
  return data
}

function facetTextFields(fields: Record<string, string>): Omit<FacetExtra, 'taxonomy'> {
  const { taxonomy: _taxonomy, ...textFields } = facetFields(fields)
  return textFields
}

function extraFieldKeys(type: SourceType, fields: Record<string, string>): string[] {
  switch (type) {
    case 'Character': return Object.keys(characterFields(fields))
    case 'Bot': return Object.keys(botFields(fields))
    case 'Reward': return Object.keys(rewardFields(fields))
    case 'Dream': return Object.keys(dreamFields(fields))
    case 'Scenario': return Object.keys(scenarioFields(fields))
    case 'Project': return Object.keys(projectFields(fields))
    case 'Facet': return Object.keys(facetFields(fields))
  }
}

async function promoteAsset(
  type: SourceType,
  id: number,
  artImageId: number,
): Promise<void> {
  switch (type) {
    case 'Project': await prisma.project.update({ where: { id }, data: { artImageId } }); return
    case 'Character': await prisma.character.update({ where: { id }, data: { artImageId } }); return
    case 'Bot': await prisma.bot.update({ where: { id }, data: { artImageId } }); return
    case 'Facet': await prisma.facet.update({ where: { id }, data: { artImageId } }); return
    case 'Dream': await prisma.dream.update({ where: { id }, data: { artImageId } }); return
    case 'Reward': await prisma.reward.update({ where: { id }, data: { artImageId } }); return
    case 'Scenario': await prisma.scenario.update({ where: { id }, data: { artImageId } }); return
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
  if (!facet) throw createError({ statusCode: 404, message: `Facet #${id} not found.` })

  const requestedTaxonomy = facetFields(fields).taxonomy
  const fallbackTaxonomy = normalizeFacetTaxonomy(existingProfile?.taxonomy, 'OTHER')
  const taxonomy = requestedTaxonomy ?? fallbackTaxonomy

  if (!existingProfile) {
    const profile = buildFacetProfileCreateData(
      { taxonomy },
      { title: facet.title, taxonomy },
    )
    await tx.facetProfile.create({ data: { facetId: id, ...profile } })
  } else if (requestedTaxonomy) {
    const profile = buildFacetProfileUpdateData(
      { taxonomy: requestedTaxonomy },
      { title: facet.title, taxonomy: fallbackTaxonomy },
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
      await tx.project.update({ where: { id }, data: { pitch: text, ...projectFields(fields) } })
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
      const extra = facetFields(fields)
      await tx.facet.update({
        where: { id },
        data: {
          description: text,
          ...facetTextFields(fields),
          ...(extra.taxonomy
            ? { kind: legacyFacetKindForTaxonomy(extra.taxonomy) }
            : {}),
        },
      })
      await syncFacetProfileUpdate(tx, id, fields)
      return
    }
    case 'Dream':
      await tx.dream.update({ where: { id }, data: { pitch: text, ...dreamFields(fields) } })
      return
    case 'Reward':
      await tx.reward.update({ where: { id }, data: { description: text, ...rewardFields(fields) } })
      return
    case 'Scenario':
      await tx.scenario.update({ where: { id }, data: { description: text, ...scenarioFields(fields) } })
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
      return (await tx.reward.create({ data: { name, description: text, ...priv, ...rewardFields(fields) } })).id
    case 'Scenario':
      return (await tx.scenario.create({ data: { title: name, description: text || name, intros: '', ...priv, ...scenarioFields(fields) } })).id
    case 'Dream':
      return (await tx.dream.create({ data: { title: name, pitch: text, ...priv, ...dreamFields(fields) } })).id
    case 'Project':
      return (await tx.project.create({ data: { title: name, pitch: text, ...priv, ...projectFields(fields) } })).id
    case 'Facet': {
      const extra = facetFields(fields)
      const taxonomy = extra.taxonomy ?? 'OTHER'
      const facet = await tx.facet.create({
        data: {
          title: name,
          description: text,
          ...priv,
          ...facetTextFields(fields),
          kind: legacyFacetKindForTaxonomy(taxonomy),
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
    await tx.dream.update({ where: { id: sourceId }, data: { Characters: { connect: { id: targetId } } } })
    return true
  }
  if (sourceType === 'Dream' && targetType === 'Reward') {
    await tx.dream.update({ where: { id: sourceId }, data: { Rewards: { connect: { id: targetId } } } })
    return true
  }
  if (sourceType === 'Dream' && targetType === 'Scenario') {
    await tx.dream.update({ where: { id: sourceId }, data: { Scenarios: { connect: { id: targetId } } } })
    return true
  }
  if (sourceType === 'Project' && targetType === 'Bot') {
    await tx.project.update({ where: { id: sourceId }, data: { managerBotId: targetId } })
    return true
  }
  if (sourceType === 'Dream' && targetType === 'Bot') {
    await tx.dream.update({ where: { id: sourceId }, data: { narratorId: targetId } })
    return true
  }
  if (sourceType === 'Character' && targetType === 'Reward') {
    await tx.character.update({ where: { id: sourceId }, data: { Rewards: { connect: { id: targetId } } } })
    return true
  }
  if (sourceType === 'Scenario' && targetType === 'Character') {
    await tx.scenario.update({ where: { id: sourceId }, data: { Characters: { connect: { id: targetId } } } })
    return true
  }
  if (sourceType === 'Character' && targetType === 'Scenario') {
    await tx.character.update({ where: { id: sourceId }, data: { Scenarios: { connect: { id: targetId } } } })
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
      isAdmin: auth.user.Role === 'ADMIN' || auth.user.id === 1,
    }

    const item = await prisma.modelBuildItem.findUnique({
      where: { id },
      include: { Run: { select: { userId: true, sourceType: true, sourceId: true } } },
    })
    if (!item) {
      event.node.res.statusCode = 404
      return { success: false, message: 'Build item not found.', statusCode: 404 }
    }
    assertRunAccess(item.Run, auth.user)

    const sourceType = item.Run.sourceType
    if (!isSourceType(sourceType)) {
      throw createError({ statusCode: 400, message: `Unsupported source type "${sourceType}".` })
    }
    const sourceId = item.Run.sourceId
    const text = (item.pitch || item.fieldsDraft || '').trim()
    const name =
      (item.pitch?.split('\n')[0]?.trim() || item.label || 'Untitled').slice(0, 255)
    const fieldMap = parseFieldLines(item.fieldsDraft)

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
      | { action: 'ASSET_ONLY'; targetType: SourceType; targetId: number; field: string; value: number }
      | { action: 'UPDATE'; targetType: SourceType; targetId: number; field: string; value: string; fields: string[] }
      | { action: 'CREATE'; targetType: SourceType; name: string; text: string; fields: string[] }

    if (item.action === 'ASSET_ONLY') {
      if (!item.artImageId) {
        throw createError({ statusCode: 400, message: 'Generate and keep an asset before committing.' })
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
        throw createError({ statusCode: 400, message: 'Add pitch/field text before committing an update.' })
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
        throw createError({ statusCode: 400, message: `Commit for "${item.outputKey}" is not supported yet.` })
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
        await promoteAsset(sourceType, sourceId, plan.value)
        target = { type: sourceType, id: sourceId, created: false }
      } else if (plan.action === 'UPDATE') {
        await prisma.$transaction((tx) =>
          updateText(tx, sourceType, sourceId, plan.value, fieldMap, syncOptions),
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

    const stages = parseStoredJson<Record<string, unknown>>(item.stageStatuses, {})
    stages.COMMIT = {
      status: 'approved',
      note: `Committed → ${target.type} #${target.id}${target.created ? (target.linked ? ' (created + linked)' : ' (created)') : ''}`,
    }

    const updated = await prisma.modelBuildItem.update({
      where: { id },
      data: {
        targetType: target.type,
        targetId: target.id,
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
