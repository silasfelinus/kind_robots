// /server/api/model-builder/items/[id]/commit.post.ts
//
// Execute the approved COMMIT for a build item — the durable, idempotent write.
//
// - ASSET_ONLY: promote the item's generated ArtImage onto the source record's
//   canonical `artImageId`.
// - UPDATE: write the item's pitch into a single safe text field on the source,
//   plus any additional known columns parsed from the item's structured FIELDS
//   draft (t-028).
// - CREATE: create a new private/inactive (draft-early) related record and link
//   it to the source via the known relation, populated with the same known
//   columns.
//
// Idempotency: the first commit atomically claims the item by setting its unique
// `idempotencyKey`; a replay returns the existing target instead of writing
// again. If the write fails after the claim, the claim is released so a retry can
// run. CREATE + link happen in one transaction so a link failure never leaves an
// orphan. COMMIT never overwrites unrelated canonical data — it only touches the
// fields it owns (the single text field plus the model's known field spec).

import { createError, defineEventHandler, readBody } from 'h3'
import type { Rarity, RewardType, DreamType, FacetKind } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { assertRunAccess, getItemId, parseStoredJson } from '../../runs/index'
import { CREATE_TARGETS, fieldSpecFor } from '~/stores/helpers/modelBuilderFields'

// prisma is $extends()-wrapped (see server/utils/prisma.ts), so its
// $transaction callback's tx param has extended InternalArgs that don't
// structurally match the plain Prisma.TransactionClient type. Derive the
// type from the actual instance instead of the generated default.
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

// ── Structured FIELDS-draft parsing (t-028) ─────────────────────────────────
//
// The FIELDS stage draft is free text of "field: value" lines (one per line,
// per modelBuilderSuggest's `fields` prompt). Parse it into a lowercased-key
// map, then apply only the columns modelBuilderFields.ts already knows about
// for the target model — the single source of per-model field truth used to
// auto-fill and AI-ground the FIELDS stage (t-024). Choice fields are
// validated against their pool; unknown keys are ignored; nothing here writes
// an arbitrary column.

const LONG_TEXT_MAX = 20000
const DEFAULT_TEXT_MAX = 256

// Short VarChar columns whose real schema limit is longer than the default cap.
const SHORT_TEXT_MAX: Partial<Record<SourceType, Record<string, number>>> = {
  Character: { class: 764, species: 764 },
  Bot: { subtitle: 764 },
  Reward: { flavorText: 512, collection: 764 },
  Dream: { flavorText: 512 },
}

// Free-text fields backed by a Text/LongText column but not flagged `prose` in
// the field spec — cap generously rather than truncating at the short default.
const LONG_TEXT_FIELDS: Partial<Record<SourceType, Set<string>>> = {
  Dream: new Set(['examples']),
  Scenario: new Set(['locations', 'inspirations']),
  Facet: new Set(['examples']),
}

// Fields stored as a numeric column rather than text.
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
  kind?: FacetKind
  description?: string
  examples?: string
}
function facetFields(fields: Record<string, string>): FacetExtra {
  const data: FacetExtra = {}
  const kind = pickChoice<FacetKind>(fields, 'Facet', 'kind'); if (kind) data.kind = kind
  const description = pickText(fields, 'Facet', 'description'); if (description) data.description = description
  const examples = pickText(fields, 'Facet', 'examples'); if (examples) data.examples = examples
  return data
}

// Read-only view of which extra columns a commit would write — used for the
// dry-run plan summary. Never passed directly to Prisma (see the typed
// per-model functions above for the actual write path).
function extraFieldKeys(type: SourceType, fields: Record<string, string>): string[] {
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

// Promote a generated ArtImage onto the source record's canonical art link.
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

// The single freeform text field UPDATE writes on each model, plus any
// additional known columns parsed from the item's structured FIELDS draft. A
// structured value for the same key as the primary text field wins over the
// generic `text` fallback.
async function updateText(
  type: SourceType,
  id: number,
  text: string,
  fields: Record<string, string>,
): Promise<void> {
  switch (type) {
    case 'Project':
      await prisma.project.update({ where: { id }, data: { pitch: text, ...projectFields(fields) } })
      return
    case 'Character':
      await prisma.character.update({ where: { id }, data: { backstory: text, ...characterFields(fields) } })
      return
    case 'Bot':
      await prisma.bot.update({ where: { id }, data: { description: text, ...botFields(fields) } })
      return
    case 'Facet':
      await prisma.facet.update({ where: { id }, data: { description: text, ...facetFields(fields) } })
      return
    case 'Dream':
      await prisma.dream.update({ where: { id }, data: { pitch: text, ...dreamFields(fields) } })
      return
    case 'Reward':
      await prisma.reward.update({ where: { id }, data: { description: text, ...rewardFields(fields) } })
      return
    case 'Scenario':
      await prisma.scenario.update({ where: { id }, data: { description: text, ...scenarioFields(fields) } })
      return
  }
}

// Create a private/inactive draft-early record of the target type, populated
// with the single text field plus any known columns from the structured FIELDS
// draft. Returns its id.
async function createRecord(
  tx: TransactionClient,
  type: SourceType,
  name: string,
  text: string,
  fields: Record<string, string>,
  userId: number,
): Promise<number> {
  const priv = { userId, isPublic: false, isActive: false }
  switch (type) {
    case 'Character':
      return (
        await tx.character.create({
          data: { name, backstory: text, ...priv, ...characterFields(fields) },
        })
      ).id
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
    case 'Facet':
      return (
        await tx.facet.create({
          data: { title: name, description: text, ...priv, ...facetFields(fields) },
        })
      ).id
    case 'Bot': {
      const extra = botFields(fields)
      return (
        await tx.bot.create({
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
      ).id
    }
    default:
      throw createError({
        statusCode: 400,
        message: `Cannot create a ${type as string}.`,
      })
  }
}

// Link a newly created target back to its source via the known relation.
// Returns true if a link was written, false if the pair has no known relation.
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
  if (sourceType === 'Character' && targetType === 'Reward') {
    await tx.character.update({
      where: { id: sourceId },
      data: { Rewards: { connect: { id: targetId } } },
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
      throw createError({
        statusCode: 400,
        message: `Unsupported source type "${sourceType}".`,
      })
    }
    const sourceId = item.Run.sourceId
    const text = (item.pitch || item.fieldsDraft || '').trim()
    const name =
      (item.pitch?.split('\n')[0]?.trim() || item.label || 'Untitled').slice(0, 255)
    const fieldMap = parseFieldLines(item.fieldsDraft)

    // Already committed? Return the recorded target without writing again.
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

    // Plan the write (also the dry-run response).
    let plan:
      | { action: 'ASSET_ONLY'; targetType: SourceType; targetId: number; field: string; value: number }
      | { action: 'UPDATE'; targetType: SourceType; targetId: number; field: string; value: string; fields: string[] }
      | { action: 'CREATE'; targetType: SourceType; name: string; text: string; fields: string[] }

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

    // Atomic claim: only one commit may proceed. count === 0 means another
    // request already claimed/committed this item.
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

    // Execute the durable write. On any failure, release the claim so a retry
    // can run (compensating cleanup).
    let target: CommitTarget
    try {
      if (plan.action === 'ASSET_ONLY') {
        await promoteAsset(sourceType, sourceId, plan.value)
        target = { type: sourceType, id: sourceId, created: false }
      } else if (plan.action === 'UPDATE') {
        await updateText(sourceType, sourceId, plan.value, fieldMap)
        target = { type: sourceType, id: sourceId, created: false }
      } else {
        const targetType = plan.targetType
        const created = await prisma.$transaction(async (tx) => {
          const newId = await createRecord(tx, targetType, name, text, fieldMap, auth.user.id)
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

    // Record the commit on the item (COMMIT stage + target) so it survives resume.
    // stageStatuses is stored as serialized JSON text (see prisma/model-builder.prisma).
    const stages = parseStoredJson<Record<string, unknown>>(
      item.stageStatuses,
      {},
    )
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
