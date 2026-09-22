// /server/utils/entityArt.ts
import { createError, getRequestURL, type H3Event } from 'h3'
/*
 * Keep this import multi-line. utils/scripts/verifyEntityArtManager.ts anchors
 * on its exact shape, and `prettier --write` collapses it to one line, which
 * breaks that contract. This file is intentionally excluded from prettier
 * formatting for that reason.
 */
import type { Prisma, PrismaClient } from '~/prisma/generated/prisma/client'
import {
  artContextRules,
  artSlotFraming,
  artStyleTail,
} from '~/utils/entityArtPromptFraming'
import {
  buildFacetIdentityPromptFrom,
  readsAsPastedDescription,
  isLegacyGeneratedFacetPrompt,
} from '~/utils/facetVisualLanguage'

export type EntityArtType =
  | 'bot'
  | 'dream'
  | 'character'
  | 'scenario'
  | 'reward'
  | 'facet'
  | 'project'
  | 'achievement'
  | 'resource'

export type EntityArtMode = 'recreate' | 'img2img'

export type EntityArtRequest = {
  entityType?: string | null
  entityId?: number | string | null
  field?: string | null
  preserveOriginal?: boolean | null
  mode?: string | null
}

export type EntityArtMetadata = {
  entityType: EntityArtType
  entityId: number
  field: string
  preserveOriginal: boolean
  mode: EntityArtMode
}

export type EntityArtAuth = {
  user: { id: number }
  isAdmin: boolean
}

export type EntityArtDb = PrismaClient | Prisma.TransactionClient
type EntityArtRecord = Record<string, unknown> & {
  id: number
  userId?: number | null
  artImageId?: number | null
  isPublic?: boolean | null
  isMature?: boolean | null
  designer?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  avatarImage?: string | null
  cardPath?: string | null
  heroPath?: string | null
  iconPath?: string | null
}

type EntityArtFieldConfig = {
  label: string
  width: number
  height: number
  primary: boolean
  /**
   * A slot that is no longer generated. Entity art is collapsing to one
   * primary render plus the inspiration gallery (Silas, 2026-09-05), so
   * card/hero/icon are retired: prepareEntityArtEnqueue refuses new work for
   * them, while completion, reads and the existing stored images are all left
   * alone so any straggler already in the queue still lands and no rendered
   * art disappears from a page.
   */
  retired?: boolean
}

export const ENTITY_FIELDS: Record<
  EntityArtType,
  Record<string, EntityArtFieldConfig>
> = {
  /*
   * Card and hero slots use the canonical Kind Robots variant sizes -- card
   * 512x768 (2:3), hero 1280x720 (16:9) -- matching `project` below and the
   * icon/card/hero contract in conductor's ART-PROMPTS.md. The gallery picks
   * which variant to fetch per view mode, so an object without them can only
   * ever render one layout. Existing Facet art paths remain valid while new
   * variants use the same canonical dimensions as every other major model.
   *
   * ICON vs ICONPATH -- these are different things and the distinction matters
   * (Silas, 2026-08-01). `icon` is a NAME for an existing simple icon in the
   * Kind Robots set (e.g. 'kind-icon:bot'); it is never an art slot and never
   * generated. `iconPath` points at a fully developed logo image and IS an art
   * slot, rendered at 256x256 so small grid cells stop reusing a 1024px
   * portrait. `project` renders its `imagePath` primary at the same 1024x1024
   * as every other collapsed entity, so the one main image is large enough to
   * be re-cropped into a hero or card frame; the 256x256 icon variant it used
   * to be could not. server/api/conductor/project-art-complete.post.ts still
   * maps that field onto the ArtImage `iconPath` variant, so conductor's own
   * icon deliveries keep landing. Migrating project onto a real iconPath
   * column is deliberately left for t-009.
   */
  bot: {
    avatarImage: {
      label: 'Avatar',
      width: 1024,
      height: 1024,
      primary: true,
    },
    iconPath: {
      label: 'Icon',
      width: 256,
      height: 256,
      primary: false,
      retired: true,
    },
    cardPath: {
      label: 'Card',
      width: 512,
      height: 768,
      primary: false,
      retired: true,
    },
    heroPath: {
      label: 'Hero',
      width: 1280,
      height: 720,
      primary: false,
      retired: true,
    },
  },
  dream: {
    imagePath: {
      label: 'Dream',
      width: 512,
      height: 768,
      primary: true,
    },
  },
  character: {
    imagePath: {
      label: 'Portrait',
      width: 1024,
      height: 1024,
      primary: true,
    },
    iconPath: {
      label: 'Icon',
      width: 256,
      height: 256,
      primary: false,
      retired: true,
    },
    cardPath: {
      label: 'Card',
      width: 512,
      height: 768,
      primary: false,
      retired: true,
    },
    heroPath: {
      label: 'Hero',
      width: 1280,
      height: 720,
      primary: false,
      retired: true,
    },
  },
  scenario: {
    imagePath: {
      label: 'Scenario',
      width: 1536,
      height: 864,
      primary: true,
    },
    iconPath: {
      label: 'Icon',
      width: 256,
      height: 256,
      primary: false,
      retired: true,
    },
    cardPath: {
      label: 'Card',
      width: 512,
      height: 768,
      primary: false,
      retired: true,
    },
    heroPath: {
      label: 'Hero',
      width: 1280,
      height: 720,
      primary: false,
      retired: true,
    },
  },
  reward: {
    imagePath: {
      label: 'Reward',
      width: 1024,
      height: 1024,
      primary: true,
    },
    iconPath: {
      label: 'Icon',
      width: 256,
      height: 256,
      primary: false,
      retired: true,
    },
    cardPath: {
      label: 'Card',
      width: 512,
      height: 768,
      primary: false,
      retired: true,
    },
    heroPath: {
      label: 'Hero',
      width: 1280,
      height: 720,
      primary: false,
      retired: true,
    },
  },
  facet: {
    imagePath: {
      label: 'Image',
      width: 1024,
      height: 1024,
      primary: true,
    },
    iconPath: {
      label: 'Icon',
      width: 256,
      height: 256,
      primary: false,
      retired: true,
    },
    cardPath: {
      label: 'Card',
      width: 512,
      height: 768,
      primary: false,
      retired: true,
    },
    heroPath: {
      label: 'Hero',
      width: 1280,
      height: 720,
      primary: false,
      retired: true,
    },
  },
  achievement: {
    imagePath: {
      label: 'Achievement',
      width: 1024,
      height: 1024,
      primary: true,
    },
  },
  /*
   * A LoRA/checkpoint preview. One square slot only -- this image exists to be
   * scanned in a catalog grid and judged (is the LoRA lackluster, is it matched
   * to the wrong base, is it mature), not to be framed as a card or a hero.
   */
  resource: {
    imagePath: {
      label: 'Preview',
      width: 1024,
      height: 1024,
      primary: true,
    },
  },
  project: {
    imagePath: {
      label: 'Image',
      width: 1024,
      height: 1024,
      primary: true,
    },
    cardPath: {
      label: 'Card',
      width: 512,
      height: 768,
      primary: false,
      retired: true,
    },
    heroPath: {
      label: 'Hero',
      width: 1280,
      height: 720,
      primary: false,
      retired: true,
    },
  },
}

const IMAGE_API_PATTERN = /\/api\/art\/images\/(\d+)\/file/
const MAX_SOURCE_BYTES = 20 * 1024 * 1024

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function positiveId(value: unknown, label: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: `Invalid ${label}.` })
  }
  return id
}

function safeText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }
  return ''
}

function safeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export function cleanSlug(value: unknown, fallback: string): string {
  const cleaned = safeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || fallback
}

function mimeForFileType(fileType: unknown): string {
  const clean = safeText(fileType).toLowerCase().replace(/^\./, '')
  if (clean === 'jpg' || clean === 'jpeg') return 'image/jpeg'
  if (clean === 'webp') return 'image/webp'
  return 'image/png'
}

function fileTypeFromPath(value: unknown): string {
  const match = safeText(value).match(/\.([a-z0-9]+)(?:[?#].*)?$/i)
  const extension = match?.[1]?.toLowerCase()
  return extension && ['png', 'jpg', 'jpeg', 'webp'].includes(extension)
    ? extension
    : 'webp'
}

function imageIdFromPath(value: unknown): number | null {
  const id = Number(safeText(value).match(IMAGE_API_PATTERN)?.[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

export function normalizeEntityArtType(value: unknown): EntityArtType {
  const type = safeText(value).toLowerCase()
  if (
    type === 'bot' ||
    type === 'dream' ||
    type === 'character' ||
    type === 'scenario' ||
    type === 'reward' ||
    type === 'facet' ||
    type === 'project' ||
    type === 'achievement' ||
    type === 'resource'
  ) {
    return type
  }
  throw createError({
    statusCode: 400,
    message:
      'Choose Bot, Dream, Character, Scenario, Reward, Facet, Project, Achievement, or Resource.',
  })
}

export function getEntityArtFieldConfig(
  entityType: EntityArtType,
  value: unknown,
): EntityArtFieldConfig & { field: string } {
  const field = safeText(value)
  const config = ENTITY_FIELDS[entityType][field]
  if (!config) {
    throw createError({
      statusCode: 400,
      message: `Invalid ${entityType} image field.`,
    })
  }
  return { field, ...config }
}

export type EntityArtSlotInfo = {
  field: string
  label: string
  width: number
  height: number
  primary: boolean
  retired: boolean
}

/**
 * The slot roster for an entity type, primary first.
 *
 * Call sites used to hardcode their own slot arrays, which is how
 * project-detail.vue and conductor-page.vue ended up offering Hero, Card and
 * Icon as three peer tabs months after the slot collapse retired all three
 * (Silas, 2026-09-11: "we're still displaying as if they are expecting a three
 * way card hero icon set"). Serving the roster from the same table that
 * `prepareEntityArtEnqueue` refuses retired work from means a client cannot
 * offer to generate a slot the server will reject.
 */
export function listEntityArtSlots(
  entityType: EntityArtType,
): EntityArtSlotInfo[] {
  return Object.entries(ENTITY_FIELDS[entityType])
    .map(([field, config]) => ({
      field,
      label: config.label,
      width: config.width,
      height: config.height,
      primary: config.primary,
      retired: config.retired === true,
    }))
    .sort((left, right) => Number(right.primary) - Number(left.primary))
}

export function entityArtHistoryPrefix(
  entityType: EntityArtType,
  entityId: number,
): string {
  return `entity:${entityType}:${entityId}:history:`
}

function entityArtCurrentPath(
  entityType: EntityArtType,
  entityId: number,
  field: string,
): string {
  return `entity:${entityType}:${entityId}:current:${field}`
}

export async function getEntityArtRecord(
  db: EntityArtDb,
  entityType: EntityArtType,
  entityId: number,
): Promise<EntityArtRecord | null> {
  switch (entityType) {
    case 'bot':
      return (await db.bot.findUnique({
        where: { id: entityId },
      })) as EntityArtRecord | null
    case 'dream':
      return (await db.dream.findUnique({
        where: { id: entityId },
      })) as EntityArtRecord | null
    case 'character':
      return (await db.character.findUnique({
        where: { id: entityId },
      })) as EntityArtRecord | null
    case 'scenario':
      return (await db.scenario.findUnique({
        where: { id: entityId },
      })) as EntityArtRecord | null
    case 'reward':
      return (await db.reward.findUnique({
        where: { id: entityId },
      })) as EntityArtRecord | null
    case 'facet': {
      /*
       * The taxonomy rides along with the record because the prompt builder
       * needs it and it does not live on Facet -- FacetProfile is a standalone
       * table keyed by facetId, with no Prisma relation to follow. Without it
       * buildEntityArtPrompt cannot pick a taxonomy clause, which is how this
       * path spent six producer versions queueing art that had never read one.
       */
      const facet = await db.facet.findUnique({ where: { id: entityId } })
      if (!facet) return null
      const profile = await db.facetProfile.findUnique({
        where: { facetId: entityId },
        select: { taxonomy: true },
      })
      return {
        ...facet,
        taxonomy: profile?.taxonomy ?? null,
      } as EntityArtRecord
    }
    case 'project':
      return (await db.project.findUnique({
        where: { id: entityId },
      })) as EntityArtRecord | null
    case 'achievement':
      return (await db.achievement.findUnique({
        where: { id: entityId },
      })) as EntityArtRecord | null
    case 'resource':
      return (await db.resource.findUnique({
        where: { id: entityId },
      })) as EntityArtRecord | null
  }
}

export function assertEntityArtAccess(
  record: EntityArtRecord,
  auth: EntityArtAuth,
): void {
  if (auth.isAdmin) return
  if (record.userId && record.userId === auth.user.id) return
  throw createError({
    statusCode: 403,
    message: 'You cannot edit artwork for this item.',
  })
}

export async function resolveEntityArtTarget(
  db: EntityArtDb,
  entityTypeValue: unknown,
  entityIdValue: unknown,
  fieldValue: unknown,
  auth?: EntityArtAuth,
): Promise<{
  entityType: EntityArtType
  entityId: number
  field: string
  config: EntityArtFieldConfig
  record: EntityArtRecord
}> {
  const entityType = normalizeEntityArtType(entityTypeValue)
  const entityId = positiveId(entityIdValue, 'entity ID')
  const { field, ...config } = getEntityArtFieldConfig(entityType, fieldValue)
  const record = await getEntityArtRecord(db, entityType, entityId)
  if (!record) {
    throw createError({
      statusCode: 404,
      message: `${entityType} ${entityId} was not found.`,
    })
  }
  if (auth) assertEntityArtAccess(record, auth)
  return { entityType, entityId, field, config, record }
}

export function recordTitle(
  entityType: EntityArtType,
  record: EntityArtRecord,
): string {
  return (
    safeText(record.title) ||
    safeText(record.name) ||
    safeText(record.label) ||
    `${entityType} ${record.id}`
  )
}

function currentFieldPath(record: EntityArtRecord, field: string): string {
  return safeText(record[field])
}

/**
 * The per-slot id column for a secondary field, or null for the primary.
 *
 * cardPath -> cardArtImageId, and so on. Added 2026-08-06 so a slot's path
 * field can hold a real file path instead of doubling as an id carrier.
 */
export function slotArtImageIdField(field: string): string | null {
  const match = field.match(/^(card|hero|icon)Path$/)
  if (!match) return null
  const slot = match[1]
  return slot ? `${slot}ArtImageId` : null
}

function currentArtImageId(
  record: EntityArtRecord,
  field: string,
  primary: boolean,
): number | null {
  /*
   * Resolution order, most to least authoritative:
   *
   * 1. The slot's own id column. Once populated this is the only source that
   *    stays correct when the path field holds a static file path.
   * 2. The id embedded in an /api/art/images/<id>/file URL. This WAS the only
   *    source for secondary slots, and remains the fallback for rows the
   *    backfill has not reached.
   * 3. The record's primary artImageId — but only for the primary field.
   *    Falling back to it for a card or hero would resolve the portrait, and
   *    the next overwrite would archive the wrong image.
   */
  const slotField = slotArtImageIdField(field)
  if (slotField) {
    const slotId = Number(record[slotField])
    if (Number.isInteger(slotId) && slotId > 0) return slotId
  }

  const fromPath = imageIdFromPath(record[field])
  if (fromPath) return fromPath

  const id = Number(record.artImageId)
  return primary && Number.isInteger(id) && id > 0 ? id : null
}

/*
 * interface-vision/t-079: one join row is how an ArtImage becomes visible in
 * an entity's history (listEntityArtHistory queries this table now, not
 * ArtImage.path prefixes). Used both when an existing ArtImage is reused as
 * history (no duplicate row) and when a fresh duplicate is created for the
 * legacy no-artImageId fallback -- either way, the row that should show up
 * in history needs a link. project keeps writing ProjectArtImage too: its
 * own dedicated gallery endpoint (/api/projects/[id]/art) still reads that
 * table unchanged, so both need to stay in sync at archive time.
 */
async function linkEntityArtImage(
  db: EntityArtDb,
  entityType: EntityArtType,
  entityId: number,
  artImageId: number,
): Promise<void> {
  await db.entityArtImage.upsert({
    where: {
      entityType_entityId_artImageId: { entityType, entityId, artImageId },
    },
    create: { entityType, entityId, artImageId },
    update: {},
  })

  if (entityType === 'project') {
    await db.projectArtImage.upsert({
      where: {
        projectId_artImageId: { projectId: entityId, artImageId },
      },
      create: { projectId: entityId, artImageId },
      update: {},
    })
  }
}

async function createHistoryReference(
  db: EntityArtDb,
  input: {
    entityType: EntityArtType
    entityId: number
    field: string
    record: EntityArtRecord
    referencePath: string
    sourceArtImageId?: number | null
  },
) {
  const title = recordTitle(input.entityType, input.record)
  const fieldConfig = getEntityArtFieldConfig(input.entityType, input.field)
  const source = input.sourceArtImageId
    ? await db.artImage.findUnique({ where: { id: input.sourceArtImageId } })
    : null
  const timestamp = Date.now()
  const slug = cleanSlug(title, `${input.entityType}-${input.entityId}`)

  const history = await db.artImage.create({
    data: {
      userId: input.record.userId ?? source?.userId ?? 1,
      fileName: `${slug}-${fieldConfig.label.toLowerCase()}-previous-${timestamp}`,
      fileType:
        safeText(source?.fileType) || fileTypeFromPath(input.referencePath),
      imagePath: input.referencePath,
      path: `${entityArtHistoryPrefix(input.entityType, input.entityId)}${input.field}:${timestamp}`,
      promptString: source?.promptString ?? source?.artPrompt ?? null,
      artPrompt:
        source?.artPrompt ??
        `Previous ${fieldConfig.label.toLowerCase()} retained from ${title}`,
      negativePrompt: source?.negativePrompt ?? null,
      checkpoint: source?.checkpoint ?? null,
      checkpointResourceId: source?.checkpointResourceId ?? null,
      sampler: source?.sampler ?? null,
      seed: source?.seed ?? -1,
      steps: source?.steps ?? null,
      cfg: source?.cfg ?? 3,
      cfgHalf: source?.cfgHalf ?? false,
      designer: source?.designer ?? input.record.designer ?? 'Kind Robots',
      isPublic: input.record.isPublic ?? source?.isPublic ?? true,
      isMature: input.record.isMature ?? source?.isMature ?? false,
      isActive: true,
    },
  })

  await linkEntityArtImage(db, input.entityType, input.entityId, history.id)

  return history
}

export async function archiveCurrentEntityArt(
  db: EntityArtDb,
  input: {
    entityType: EntityArtType
    entityId: number
    field: string
    config: EntityArtFieldConfig
    record: EntityArtRecord
  },
) {
  const path = currentFieldPath(input.record, input.field)
  const sourceArtImageId = currentArtImageId(
    input.record,
    input.field,
    input.config.primary,
  )
  const referencePath = sourceArtImageId
    ? `/api/art/images/${sourceArtImageId}/file`
    : path
  if (!referencePath) return null

  /*
   * interface-vision/t-079: when the current slot already names a real
   * ArtImage row (sourceArtImageId), archiving means "keep this row
   * reachable from history" -- a join, not a copy. Previously only project
   * got this treatment; every entity type has the same reusable id now, so
   * every entity type gets the same non-duplicating archive. The
   * createHistoryReference duplicate-row path below is now reached only by
   * the legacy fallback: a bare path string with no artImageId behind it
   * (e.g. an old Bot avatarImage set before this table tracked art), which
   * still needs a real ArtImage row created before it can be linked at all.
   */
  if (sourceArtImageId) {
    await linkEntityArtImage(
      db,
      input.entityType,
      input.entityId,
      sourceArtImageId,
    )
    return db.artImage.findUnique({ where: { id: sourceArtImageId } })
  }

  return createHistoryReference(db, {
    ...input,
    referencePath,
    sourceArtImageId,
  })
}

async function updateEntityRecord(
  db: EntityArtDb,
  input: {
    entityType: EntityArtType
    entityId: number
    field: string
    config: EntityArtFieldConfig
    artImageId: number
    imagePath: string
  },
): Promise<EntityArtRecord> {
  /*
   * Card and hero are SECONDARY slots: they write only their own column and
   * must never touch the primary field or artImageId, which together define the
   * record's canonical image. Without this branch a card render (2:3) would
   * overwrite the square avatar/portrait it was meant to sit beside.
   * Null means "this is the primary slot" — each case then supplies its own
   * primary shape, since bot mirrors into both avatarImage and imagePath.
   */
  const slotIdField = slotArtImageIdField(input.field)
  const slotData = slotIdField
    ? {
        [input.field]: input.imagePath,
        /*
         * Written together, always. The id column is what lets the path be a
         * plain file path; a slot that updated one without the other would
         * either lose track of its image or point at the wrong one.
         */
        [slotIdField]: input.artImageId,
      }
    : null

  switch (input.entityType) {
    case 'bot':
      return (await db.bot.update({
        where: { id: input.entityId },
        data: slotData ?? {
          avatarImage: input.imagePath,
          imagePath: input.imagePath,
          artImageId: input.artImageId,
        },
      })) as EntityArtRecord
    case 'dream':
      return (await db.dream.update({
        where: { id: input.entityId },
        data: {
          imagePath: input.imagePath,
          artImageId: input.artImageId,
        },
      })) as EntityArtRecord
    case 'character':
      return (await db.character.update({
        where: { id: input.entityId },
        data: slotData ?? {
          imagePath: input.imagePath,
          artImageId: input.artImageId,
        },
      })) as EntityArtRecord
    case 'scenario':
      return (await db.scenario.update({
        where: { id: input.entityId },
        data: slotData ?? {
          imagePath: input.imagePath,
          artImageId: input.artImageId,
        },
      })) as EntityArtRecord
    case 'reward':
      return (await db.reward.update({
        where: { id: input.entityId },
        data: slotData ?? {
          imagePath: input.imagePath,
          artImageId: input.artImageId,
        },
      })) as EntityArtRecord
    case 'achievement':
      return (await db.achievement.update({
        where: { id: input.entityId },
        data: {
          imagePath: input.imagePath,
          artImageId: input.artImageId,
        },
      })) as EntityArtRecord
    case 'project': {
      const project = await db.project.update({
        where: { id: input.entityId },
        data: slotData ?? {
          imagePath: input.imagePath,
          artImageId: input.artImageId,
        },
      })
      await db.projectArtImage.upsert({
        where: {
          projectId_artImageId: {
            projectId: input.entityId,
            artImageId: input.artImageId,
          },
        },
        create: { projectId: input.entityId, artImageId: input.artImageId },
        update: {},
      })
      return project as EntityArtRecord
    }
    case 'facet':
      return (await db.facet.update({
        where: { id: input.entityId },
        data: slotData ?? {
          imagePath: input.imagePath,
          artImageId: input.artImageId,
        },
      })) as EntityArtRecord
    case 'resource':
      return (await db.resource.update({
        where: { id: input.entityId },
        data: {
          imagePath: input.imagePath,
          artImageId: input.artImageId,
        },
      })) as EntityArtRecord
  }
}

export async function applyEntityArtImage(
  db: EntityArtDb,
  input: {
    entityType: EntityArtType
    entityId: number
    field: string
    artImageId: number
    preserveOriginal: boolean
    archivedArtImageId?: number | null
  },
): Promise<{
  entity: EntityArtRecord
  archivedArtImageId: number | null
  imagePath: string
}> {
  const target = await resolveEntityArtTarget(
    db,
    input.entityType,
    input.entityId,
    input.field,
  )
  const artImage = await db.artImage.findUnique({
    where: { id: positiveId(input.artImageId, 'ArtImage ID') },
  })
  if (!artImage) {
    throw createError({
      statusCode: 404,
      message: 'Generated image was not found.',
    })
  }

  const previousArtImageId = currentArtImageId(
    target.record,
    target.field,
    target.config.primary,
  )
  if (
    target.entityType === 'project' &&
    !input.preserveOriginal &&
    previousArtImageId &&
    previousArtImageId !== artImage.id
  ) {
    await db.projectArtImage.deleteMany({
      where: {
        projectId: target.entityId,
        artImageId: previousArtImageId,
      },
    })
  }

  let archivedId: number | null = null
  if (input.preserveOriginal) {
    if (input.archivedArtImageId) {
      // The caller (the queue's overwrite-retry completion path) already
      // created a standalone ArtImage row for the pre-overwrite snapshot --
      // link it into history rather than duplicating it a second time.
      await linkEntityArtImage(
        db,
        target.entityType,
        target.entityId,
        input.archivedArtImageId,
      )
      archivedId = input.archivedArtImageId
    } else {
      const archived = await archiveCurrentEntityArt(db, target)
      archivedId = archived?.id ?? null
    }
  }

  /*
   * PREFER THE STATIC FILE. A card renders this in an `<img>`, and an `<img>`
   * sends no Authorization header -- so /api/art/images/:id/file can only apply
   * its anonymous rule, which is `isPublic && !isMature`. Every mature or
   * private entity preview therefore 403'd in the browser, blanked, and was
   * re-observed by kr-deferred-image, which is the "previews going in and out
   * of load, repeatedly" Silas reported on 2026-09-18. 1,969 of 2,343 Resources
   * were pointing at that route.
   *
   * The API route stays as the fallback for an ArtImage whose bytes live in the
   * row rather than on disk. The version query keeps busting the cache either
   * way, since the static path is stable across re-renders of the same slot.
   */
  const version =
    artImage.updatedAt?.toISOString() || artImage.createdAt.toISOString()
  const staticPath = String(artImage.imagePath || '').trim()
  const imagePath =
    staticPath && !staticPath.includes('/api/art/images/')
      ? `${staticPath}${staticPath.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`
      : `/api/art/images/${artImage.id}/file?v=${encodeURIComponent(version)}`

  await db.artImage.update({
    where: { id: artImage.id },
    data: {
      path: entityArtCurrentPath(
        target.entityType,
        target.entityId,
        target.field,
      ),
      isPublic: target.record.isPublic ?? artImage.isPublic,
      isMature: target.record.isMature ?? artImage.isMature,
    },
  })

  const entity = await updateEntityRecord(db, {
    entityType: target.entityType,
    entityId: target.entityId,
    field: target.field,
    config: target.config,
    artImageId: artImage.id,
    imagePath,
  })

  return { entity, archivedArtImageId: archivedId, imagePath }
}

export async function listEntityArtHistory(
  db: EntityArtDb,
  entityType: EntityArtType,
  entityId: number,
) {
  const historyPrefix = entityArtHistoryPrefix(entityType, entityId)
  const currentPrefix = entityArtCurrentPath(entityType, entityId, '')

  const links = await db.entityArtImage.findMany({
    where: { entityType, entityId, ArtImage: { isActive: true } },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      ArtImage: {
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          fileName: true,
          fileType: true,
          imagePath: true,
          path: true,
          promptString: true,
          artPrompt: true,
          checkpoint: true,
          checkpointResourceId: true,
          designer: true,
          isPublic: true,
          isMature: true,
        },
      },
    },
  })

  return links.map(({ createdAt: linkedAt, ArtImage: row }) => {
    /*
     * EntityArtImage doesn't carry which slot (field) an entry belongs to --
     * the join is only (entityType, entityId, artImageId). field is only
     * knowable when the joined ArtImage still carries one of entityArt.ts's
     * own path tags: the legacy history-duplicate tag (row was created
     * specifically as this field's history), or a reused primary image's
     * current-slot tag from whenever it was last active in that field. A
     * shared/plain ArtImage row carries neither, so field comes back
     * undefined -- filteredHistory's `!item.field` fallback in
     * entity-art-manager.vue already shows those under every slot rather
     * than hiding them.
     */
    const path = safeText(row.path)
    let field = ''
    if (path.startsWith(historyPrefix)) {
      field = path.slice(historyPrefix.length).split(':')[0] || ''
    } else if (path.startsWith(currentPrefix)) {
      field = path.slice(currentPrefix.length) || ''
    }
    let fieldLabel: string | undefined
    if (field) {
      try {
        fieldLabel = getEntityArtFieldConfig(entityType, field).label
      } catch {
        field = ''
      }
    }
    return {
      ...row,
      createdAt: linkedAt,
      field: field || undefined,
      fieldLabel,
    }
  })
}

function contextLines(
  entityType: EntityArtType,
  record: EntityArtRecord,
): string[] {
  const values: Record<EntityArtType, Array<[string, unknown]>> = {
    bot: [
      ['Name', record.name],
      ['Subtitle', record.subtitle],
      ['Description', record.description],
      ['Theme', record.theme],
      ['Personality', record.personality],
      ['Tagline', record.tagline],
      ['Existing art prompt', record.artPrompt],
    ],
    dream: [
      ['Title', record.title],
      ['Dream type', record.dreamType],
      ['Description', record.description],
      ['Pitch', record.pitch],
      ['Flavor text', record.flavorText],
      ['Examples', record.examples],
      ['Existing art prompt', record.artPrompt],
    ],
    character: [
      ['Name', record.name],
      ['Title', record.title],
      ['Species', record.species],
      ['Class', record.class],
      ['Role', record.role],
      ['Presentation', record.presentation],
      ['Personality', record.personality],
      ['Quirks', record.quirks],
      ['Backstory', record.backstory],
      ['Existing art prompt', record.artPrompt],
    ],
    scenario: [
      ['Title', record.title],
      ['Description', record.description],
      ['Locations', record.locations],
      ['Genres', record.genres],
      ['Inspirations', record.inspirations],
      ['Cast', record.cast],
      ['Opening ideas', record.intros],
      ['Existing art prompt', record.artPrompt],
    ],
    reward: [
      ['Name', record.name],
      ['Type', record.rewardType],
      ['Rarity', record.rarity],
      ['Description', record.description],
      ['Effect', record.effect],
      ['Flavor text', record.flavorText],
      ['Collection', record.collection],
      ['Existing art prompt', record.artPrompt],
    ],
    facet: [
      ['Title', record.title],
      ['Kind', record.kind],
      ['Description', record.description],
      ['Flavor text', record.flavorText],
      ['Examples', record.examples],
      ['Existing art prompt', record.artPrompt],
    ],
    achievement: [
      ['Label', record.label],
      ['Message', record.message],
      ['Hint', record.tooltip],
      ['Existing art prompt', record.artPrompt],
    ],
    project: [
      ['Title', record.title],
      ['Description', record.description],
      ['Pitch', record.pitch],
      ['Goal', record.goal],
      ['Flavor text', record.flavorText],
      ['Status', record.status],
      ['Priority', record.priority],
    ],
    /*
     * No 'Model type' or 'Base model' row. "Model type: LORA" and "Base model:
     * Pony" are catalog metadata, not visual concepts -- on every lane they are
     * dead tokens diluting the conditioning, and no encoder renders them.
     */
    resource: [
      ['Name', record.customLabel || record.name],
      ['Trigger words', record.defaultTrigger || record.triggerWords],
    ],
  }

  return values[entityType].flatMap(([label, value]) => {
    const text = safeText(value)
    return text ? [`${label}: ${text}`] : []
  })
}

/**
 * How the target lane reads a prompt.
 *
 * 'prose' is Flux/Krea/Kontext/Z-Image: a T5 or Qwen encoder that genuinely
 * follows instructions, where the framing sentence and the context rules earn
 * their tokens.
 *
 * 'tags' is the SD lineage -- SD 1.5, SDXL, Pony, Illustrious -- reading
 * comma-separated danbooru-style tags through CLIP. CLIP does NOT follow
 * instructions; it embeds them as CONTENT. Appending this block to a Pony
 * prompt actively harms it three ways, all observed on ArtJob 25398
 * (kind-robots/t-105, 2026-09-16):
 *   - "not as text to render" puts the token `text` in the POSITIVE prompt,
 *     working against the `text` in the negative.
 *   - "Every surface in frame is blank and unmarked" conditions toward
 *     blankness, which is not what "don't render letters" was meant to say.
 *   - "centred on one clear subject" contradicted that LoRA's own trigger
 *     words ("large male ... very small female"), and the scaffold won: the
 *     render dropped the second subject entirely.
 * It is also pure dilution. SDXL's CLIP chunks at 75 tokens; the fixed block
 * below is ~80 on its own, so it pushed every probe into a second chunk made
 * almost entirely of boilerplate. Across the 1,560 queued probes it was 71% of
 * the total prompt text, and 74% of ArtJob 25398's.
 */
export type EntityArtPromptStyle = 'prose' | 'tags'

export function buildEntityArtPrompt(
  userPrompt: string,
  target: {
    entityType: EntityArtType
    field: string
    record: EntityArtRecord
  },
  options?: { style?: EntityArtPromptStyle },
): string {
  const field = getEntityArtFieldConfig(target.entityType, target.field)
  const context = contextLines(target.entityType, target.record)

  /*
   * A `resource` target gets nothing appended, on EITHER lane. Its caller is
   * the LoRA probe, whose recipe already carries the quality tags, the trigger
   * words, and the framing -- restating the triggers under a "Trigger words:"
   * label only double-weights them by accident, and the slot framing below
   * says "centred on one clear subject", which is the exact phrase that made
   * ArtJob 25398 drop half of a two-subject LoRA.
   */
  if (target.entityType === 'resource') return userPrompt.trim()

  if ((options?.style ?? 'prose') === 'tags') {
    return [userPrompt.trim(), ...context].filter(Boolean).join('\n')
  }

  const taxonomy = safeText(target.record.taxonomy)
  const { direction, supersededArtPrompt } = facetArtDirection(
    userPrompt,
    target.entityType,
    target.record,
    taxonomy,
  )

  return [
    direction,
    '',
    // Describes the slot's shape rather than naming it. "the card artwork" made
    // Krea 2 render a literal trading card. See utils/entityArtPromptFraming.ts.
    `Compose this as ${artSlotFraming(field)} for the following ${target.entityType}.`,
    ...withoutRestatedContext(context, direction, supersededArtPrompt),
    '',
    ...artContextRules('entity'),
    /*
     * Last, because a diffusion model weights the tail as the treatment to
     * apply to everything before it. Empty for the swatch taxonomy; see
     * artStyleTail.
     */
    artStyleTail(taxonomy),
  ]
    .filter(Boolean)
    .join('\n')
}

/*
 * A stored Facet.artPrompt that a previous producer generated is rebuilt from
 * the Facet's own content before it becomes art direction.
 *
 * This is the whole reason utils/facetVisualLanguage.ts exists. Every fix to
 * the Facet prompt vocabulary between v2 and v6 landed in
 * scripts/generate_facet_art_v4.ts, and this function -- the one that actually
 * builds the prompt for art queued through the server -- took the stored
 * string verbatim, so a Facet carrying a v4 tail went on rendering v4 art
 * indefinitely. 23 of 250 live Facets sampled on 2026-09-21 still did.
 *
 * isLegacyGeneratedFacetPrompt matches only a registered producer signature,
 * so a hand-authored prompt and anything typed into the art workbench pass
 * through untouched. Rebuilding one of those would be the worse bug.
 */
/*
 * Context that the art direction already says.
 *
 * "Existing art prompt: ..." is the row that matters. When facetArtDirection
 * rebuilds a legacy Facet prompt, the stale string it just replaced was still
 * being restated here one line later -- so the card copy the rebuild removed
 * from the head of the prompt walked straight back into conditioning from the
 * context block, and the model saw it twice. The first end-to-end probe of the
 * rebuild (2026-09-21) showed exactly that: "Inventor. One person seen from
 * head to shoes ... Inventor. Builds the thing before establishing whether it
 * should exist."
 *
 * The same containment test buildArtFacetPromptAddon already applies in
 * utils/artFacetPrompt.ts, for the same reason it gives: a direction the base
 * prompt already states adds nothing by being restated, and on a text model a
 * restatement is a second vote.
 */
function withoutRestatedContext(
  context: readonly string[],
  direction: string,
  supersededArtPrompt: string,
): string[] {
  const normalize = (value: string) =>
    value.replace(/\s+/g, ' ').trim().toLowerCase()
  const base = normalize(direction)
  const superseded = normalize(supersededArtPrompt)

  return context.filter((line) => {
    const normalized = normalize(line.slice(line.indexOf(':') + 1))
    if (!normalized) return false
    // The exact string the rebuild replaced. Not a substring of the new
    // direction -- that is the point of rebuilding it -- so containment alone
    // never catches this one.
    if (superseded && normalized === superseded) return false
    return !base || !base.includes(normalized)
  })
}

function facetArtDirection(
  userPrompt: string,
  entityType: EntityArtType,
  record: EntityArtRecord,
  taxonomy: string,
): { direction: string; supersededArtPrompt: string } {
  const prompt = userPrompt.trim()
  const keep = { direction: prompt, supersededArtPrompt: '' }
  if (entityType !== 'facet' || !taxonomy) return keep
  // The v2 paste carries no generated tail, so it reads as curated here too.
  // See readsAsPastedDescription in utils/facetVisualLanguage.ts.
  const pastedDescription = readsAsPastedDescription({
    artPrompt: prompt,
    title: record.title,
    description: record.description,
  })
  if (!isLegacyGeneratedFacetPrompt(prompt) && !pastedDescription) return keep

  const rebuilt = buildFacetIdentityPromptFrom({
    title: safeText(record.title),
    taxonomy,
    // Dropped outright when it is what was pasted, matching the producer. See
    // the note on the same call in scripts/generate_facet_art_v4.ts.
    description: pastedDescription ? null : safeText(record.description),
    flavorText: safeText(record.flavorText),
    examples: safeText(record.examples),
  })
  if (!rebuilt) return keep

  /*
   * Both the prompt we were handed and whatever is stored on the record are
   * reported as superseded: the caller usually passes Facet.artPrompt straight
   * through, but the art workbench can re-queue with an older copy of it, and
   * either one restated in the context block puts the card copy back into
   * conditioning.
   */
  return { direction: rebuilt, supersededArtPrompt: prompt }
}

async function sourceFromArtImage(
  db: EntityArtDb,
  artImageId: number,
): Promise<string | null> {
  const image = await db.artImage.findUnique({
    where: { id: artImageId },
    select: {
      imageData: true,
      imagePath: true,
      fileType: true,
    },
  })
  if (!image) return null
  if (image.imageData) {
    return `data:${mimeForFileType(image.fileType)};base64,${image.imageData}`
  }
  return image.imagePath || null
}

async function fetchSourceData(event: H3Event, value: string): Promise<string> {
  if (value.startsWith('data:image/')) return value

  const url = new URL(value, getRequestURL(event).origin)
  const response = await fetch(url)
  if (!response.ok) {
    throw createError({
      statusCode: 409,
      message: `The current image could not be loaded for img2img (${response.status}).`,
    })
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  if (!bytes.length || bytes.length > MAX_SOURCE_BYTES) {
    throw createError({
      statusCode: 413,
      message: 'The current image is unavailable or too large for img2img.',
    })
  }
  const contentType = response.headers.get('content-type') || 'image/png'
  return `data:${contentType.split(';')[0]};base64,${bytes.toString('base64')}`
}

export async function resolveEntityArtSourceImage(
  event: H3Event,
  db: EntityArtDb,
  target: Awaited<ReturnType<typeof resolveEntityArtTarget>>,
): Promise<string> {
  const primaryId = currentArtImageId(
    target.record,
    target.field,
    target.config.primary,
  )
  const fromArtImage = primaryId
    ? await sourceFromArtImage(db, primaryId)
    : null
  const source = fromArtImage || currentFieldPath(target.record, target.field)
  if (!source) {
    throw createError({
      statusCode: 409,
      message: 'Img2img needs a current image in the selected slot.',
    })
  }
  if (source.startsWith('/api/art/images/')) {
    const id = imageIdFromPath(source)
    if (id) {
      const direct = await sourceFromArtImage(db, id)
      if (direct?.startsWith('data:image/')) return direct
      if (direct) return fetchSourceData(event, direct)
    }
  }
  return fetchSourceData(event, source)
}

export async function prepareEntityArtEnqueue(
  event: H3Event,
  db: EntityArtDb,
  request: EntityArtRequest,
  auth: EntityArtAuth,
): Promise<{
  metadata: EntityArtMetadata
  target: Awaited<ReturnType<typeof resolveEntityArtTarget>>
  sourceImageBase64: string | null
}> {
  const target = await resolveEntityArtTarget(
    db,
    request.entityType,
    request.entityId,
    request.field,
    auth,
  )
  /*
   * The enqueue gate for the slot collapse. Refusing here rather than in
   * getEntityArtFieldConfig is deliberate: completion, reads and history all
   * resolve the same config, and blocking those would strand jobs already in
   * the queue and hide art that is still on the page.
   */
  if (target.config.retired) {
    throw createError({
      statusCode: 400,
      message:
        `The ${target.config.label} slot is no longer generated. One primary image now serves every ` +
        `view, cropped per frame, and previous renders remain available as inspiration.`,
    })
  }
  const mode =
    safeText(request.mode).toLowerCase() === 'img2img' ? 'img2img' : 'recreate'
  const metadata: EntityArtMetadata = {
    entityType: target.entityType,
    entityId: target.entityId,
    field: target.field,
    preserveOriginal: safeBoolean(request.preserveOriginal, true),
    mode,
  }
  return {
    metadata,
    target,
    sourceImageBase64:
      mode === 'img2img'
        ? await resolveEntityArtSourceImage(event, db, target)
        : null,
  }
}

export function readEntityArtMetadata(
  payload: unknown,
): EntityArtMetadata | null {
  const raw = asRecord(asRecord(payload).entityArt)
  if (!Object.keys(raw).length) return null
  try {
    const entityType = normalizeEntityArtType(raw.entityType)
    const entityId = positiveId(raw.entityId, 'entity ID')
    const { field } = getEntityArtFieldConfig(entityType, raw.field)
    const mode =
      safeText(raw.mode).toLowerCase() === 'img2img' ? 'img2img' : 'recreate'
    return {
      entityType,
      entityId,
      field,
      preserveOriginal: safeBoolean(raw.preserveOriginal, true),
      mode,
    }
  } catch {
    return null
  }
}

export async function applyEntityArtCompletion(
  db: EntityArtDb,
  payload: unknown,
  artImageId: number,
  archivedArtImageId?: number | null,
) {
  const metadata = readEntityArtMetadata(payload)
  if (!metadata) return null
  const result = await applyEntityArtImage(db, {
    ...metadata,
    artImageId,
    archivedArtImageId: archivedArtImageId ?? null,
  })
  return {
    ...metadata,
    artImageId,
    imagePath: result.imagePath,
    archivedArtImageId: result.archivedArtImageId,
    entity: result.entity,
  }
}
