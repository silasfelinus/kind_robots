// /server/utils/entityArt.ts
import { createError, getRequestURL, type H3Event } from 'h3'
import type {
  Prisma,
  PrismaClient,
} from '~/prisma/generated/prisma/client'

export type EntityArtType =
  | 'bot'
  | 'character'
  | 'scenario'
  | 'reward'
  | 'facet'

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

type EntityArtDb = PrismaClient | Prisma.TransactionClient
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
}

type EntityArtFieldConfig = {
  label: string
  width: number
  height: number
  primary: boolean
}

const ENTITY_FIELDS: Record<
  EntityArtType,
  Record<string, EntityArtFieldConfig>
> = {
  bot: {
    avatarImage: {
      label: 'Avatar',
      width: 1024,
      height: 1024,
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
  },
  scenario: {
    imagePath: {
      label: 'Scenario',
      width: 1536,
      height: 864,
      primary: true,
    },
  },
  reward: {
    imagePath: {
      label: 'Reward',
      width: 1024,
      height: 1024,
      primary: true,
    },
  },
  facet: {
    imagePath: {
      label: 'Image',
      width: 1024,
      height: 1024,
      primary: true,
    },
    cardPath: {
      label: 'Card',
      width: 1024,
      height: 1536,
      primary: false,
    },
    heroPath: {
      label: 'Hero',
      width: 1536,
      height: 864,
      primary: false,
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

function cleanSlug(value: unknown, fallback: string): string {
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
    type === 'character' ||
    type === 'scenario' ||
    type === 'reward' ||
    type === 'facet'
  ) {
    return type
  }
  throw createError({
    statusCode: 400,
    message: 'Choose Bot, Character, Scenario, Reward, or Facet.',
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
      return (await db.bot.findUnique({ where: { id: entityId } })) as
        | EntityArtRecord
        | null
    case 'character':
      return (await db.character.findUnique({ where: { id: entityId } })) as
        | EntityArtRecord
        | null
    case 'scenario':
      return (await db.scenario.findUnique({ where: { id: entityId } })) as
        | EntityArtRecord
        | null
    case 'reward':
      return (await db.reward.findUnique({ where: { id: entityId } })) as
        | EntityArtRecord
        | null
    case 'facet':
      return (await db.facet.findUnique({ where: { id: entityId } })) as
        | EntityArtRecord
        | null
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

function recordTitle(entityType: EntityArtType, record: EntityArtRecord): string {
  return (
    safeText(record.title) ||
    safeText(record.name) ||
    `${entityType} ${record.id}`
  )
}

function currentFieldPath(record: EntityArtRecord, field: string): string {
  return safeText(record[field])
}

function currentArtImageId(
  record: EntityArtRecord,
  field: string,
  primary: boolean,
): number | null {
  const fromPath = imageIdFromPath(record[field])
  if (fromPath) return fromPath
  const id = Number(record.artImageId)
  return primary && Number.isInteger(id) && id > 0 ? id : null
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

  return db.artImage.create({
    data: {
      userId: input.record.userId ?? source?.userId ?? 1,
      fileName: `${slug}-${fieldConfig.label.toLowerCase()}-previous-${timestamp}`,
      fileType:
        safeText(source?.fileType) ||
        fileTypeFromPath(input.referencePath),
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
      designer:
        source?.designer ?? input.record.designer ?? 'Kind Robots',
      isPublic: input.record.isPublic ?? source?.isPublic ?? true,
      isMature: input.record.isMature ?? source?.isMature ?? false,
      isActive: true,
    },
  })
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
  switch (input.entityType) {
    case 'bot':
      return (await db.bot.update({
        where: { id: input.entityId },
        data: {
          avatarImage: input.imagePath,
          imagePath: input.imagePath,
          artImageId: input.artImageId,
        },
      })) as EntityArtRecord
    case 'character':
      return (await db.character.update({
        where: { id: input.entityId },
        data: {
          imagePath: input.imagePath,
          artImageId: input.artImageId,
        },
      })) as EntityArtRecord
    case 'scenario':
      return (await db.scenario.update({
        where: { id: input.entityId },
        data: {
          imagePath: input.imagePath,
          artImageId: input.artImageId,
        },
      })) as EntityArtRecord
    case 'reward':
      return (await db.reward.update({
        where: { id: input.entityId },
        data: {
          imagePath: input.imagePath,
          artImageId: input.artImageId,
        },
      })) as EntityArtRecord
    case 'facet': {
      const data =
        input.field === 'cardPath'
          ? { cardPath: input.imagePath }
          : input.field === 'heroPath'
            ? { heroPath: input.imagePath }
            : {
                imagePath: input.imagePath,
                artImageId: input.artImageId,
              }
      return (await db.facet.update({
        where: { id: input.entityId },
        data,
      })) as EntityArtRecord
    }
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
    throw createError({ statusCode: 404, message: 'Generated image was not found.' })
  }

  let archivedId: number | null = null
  if (input.preserveOriginal) {
    if (input.archivedArtImageId) {
      const reference = await createHistoryReference(db, {
        entityType: target.entityType,
        entityId: target.entityId,
        field: target.field,
        record: target.record,
        referencePath: `/api/art/images/${input.archivedArtImageId}/file`,
        sourceArtImageId: input.archivedArtImageId,
      })
      archivedId = reference.id
    } else {
      const archived = await archiveCurrentEntityArt(db, target)
      archivedId = archived?.id ?? null
    }
  }

  const version =
    artImage.updatedAt?.toISOString() ||
    artImage.createdAt.toISOString()
  const imagePath = `/api/art/images/${artImage.id}/file?v=${encodeURIComponent(
    version,
  )}`

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
  const prefix = entityArtHistoryPrefix(entityType, entityId)
  const rows = await db.artImage.findMany({
    where: {
      isActive: true,
      path: { startsWith: prefix },
    },
    orderBy: { createdAt: 'desc' },
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
  })

  return rows.map((row) => {
    const field = safeText(row.path).slice(prefix.length).split(':')[0] || ''
    let fieldLabel = 'Image'
    try {
      fieldLabel = getEntityArtFieldConfig(entityType, field).label
    } catch {}
    return { ...row, field, fieldLabel }
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
  }

  return values[entityType].flatMap(([label, value]) => {
    const text = safeText(value)
    return text ? [`${label}: ${text}`] : []
  })
}

export function buildEntityArtPrompt(
  userPrompt: string,
  target: {
    entityType: EntityArtType
    field: string
    record: EntityArtRecord
  },
): string {
  const field = getEntityArtFieldConfig(target.entityType, target.field)
  const context = contextLines(target.entityType, target.record)
  return [
    userPrompt.trim(),
    '',
    `Create this as the ${field.label.toLowerCase()} artwork for the following ${target.entityType}.`,
    ...context,
    '',
    'Treat the first paragraph as the primary art direction. Use the entity context for identity and continuity, not as a checklist or text to render.',
    'Do not add captions, labels, UI chrome, watermarks, signatures, or readable text unless the primary art direction explicitly requests them.',
  ]
    .filter(Boolean)
    .join('\n')
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
  const mode =
    safeText(request.mode).toLowerCase() === 'img2img'
      ? 'img2img'
      : 'recreate'
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
      safeText(raw.mode).toLowerCase() === 'img2img'
        ? 'img2img'
        : 'recreate'
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
