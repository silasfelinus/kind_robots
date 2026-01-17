// path: server/api/chatgpt/actions.ts
// summary: Registry-driven generic CRUD for shared models (no zod). Exports named runAction.
import { defineEventHandler, readBody, getHeaders } from 'h3'
import prisma from '../../utils/prisma'

// ---------------- utils ----------------
type RunActionHeaders = Record<string, string | undefined>

function fail(message: string, statusCode = 400) {
  const e: any = new Error(message)
  e.statusCode = statusCode
  throw e
}
function ok<T>(data: T) {
  return { ok: true, data }
}
function parseBearer(auth?: string | null) {
  if (!auth) return null
  const [t, token] = auth.split(' ')
  return t?.toLowerCase() === 'bearer' ? token || null : null
}
async function validateSession(headers: RunActionHeaders) {
  const bearer = parseBearer(headers.authorization)
  let user = bearer
    ? await prisma.user.findFirst({ where: { apiKey: bearer } })
    : null
  if (!user && bearer)
    user = await prisma.user.findFirst({ where: { token: bearer } })
  const includeSensitive = !!user && headers['x-api-key'] === user?.apiKey
  const priority =
    user?.isMember || (!!user?.memberUntil && user.memberUntil > new Date())
      ? 'member'
      : 'free'
  return { user, includeSensitive, priority }
}
function requireUser(user: any) {
  if (!user) fail('Unauthorized', 401)
}
function isObject(v: any): v is Record<string, any> {
  return v && typeof v === 'object' && !Array.isArray(v)
}
function pick<T extends Record<string, any>>(
  obj: Record<string, any>,
  keys: readonly string[],
): T {
  const out: Record<string, any> = {}
  for (const k of keys) if (k in obj) out[k] = obj[k]
  return out as T
}
function clamp(n: any, lo: number, hi: number, fallback: number) {
  return typeof n === 'number' && Number.isFinite(n)
    ? Math.min(Math.max(n, lo), hi)
    : fallback
}

// ---------------- registry types ----------------
type ViewName = 'minimal' | 'card' | 'detail'
type ModelKey =
  | 'Art'
  | 'ArtImage'
  | 'Pitch'
  | 'Prompt'
  | 'Chat'
  | 'Scenario'
  | 'SmartIcon'
  | 'Theme'
  | 'Character'
  | 'Component'
  | 'Reaction'
  | 'Resource'
  | 'Reward'
  | 'Tag'
  | 'Gallery'

type RegistryItem = {
  delegate: any
  allowedWrite: readonly string[]
  allowedFilter: readonly string[]
  views: Record<ViewName, any> // Prisma select/include
  requireAuthOnCreate?: boolean
  requireOwnerOnUpdate?: boolean
  requireOwnerOnDelete?: boolean
  attachUserOnCreate?: boolean
  onCreate?: (data: Record<string, any>, user: any) => Record<string, any>
}

// ---------------- registry ----------------
const R: Record<ModelKey, RegistryItem> = {
  Art: {
    delegate: prisma.art,
    allowedWrite: [
      'promptString',
      'checkpoint',
      'sampler',
      'seed',
      'steps',
      'cfg',
      'cfgHalf',
      'pitchId',
      'promptId',
      'genres',
      'negativePrompt',
      'isPublic',
      'isMature',
      'galleryId',
      'path',
      'imagePath',
      'designer',
      'artImageId',
    ],
    allowedFilter: [
      'userId',
      'galleryId',
      'pitchId',
      'isPublic',
      'isMature',
      'designer',
    ],
    views: {
      minimal: { select: { id: true } },
      card: {
        select: {
          id: true,
          createdAt: true,
          promptString: true,
          checkpoint: true,
          cfg: true,
          cfgHalf: true,
          isPublic: true,
          isMature: true,
          userId: true,
          pitchId: true,
          artImageId: true,
          imagePath: true,
          designer: true,
        },
      },
      detail: {
        include: { ArtImage: true, Pitch: true, Prompt: true, User: true },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
    onCreate(data, user) {
      if (!data.designer) data.designer = user?.designerName || user?.username
      return data
    },
  },

  ArtImage: {
    delegate: prisma.artImage,
    allowedWrite: [
      'imageData',
      'fileName',
      'fileType',
      'artId',
      'galleryId',
      'userId',
      'botId',
      'componentId',
      'milestoneId',
      'pitchId',
      'promptId',
      'reactionId',
      'resourceId',
      'rewardId',
      'tagId',
      'chatId',
      'characterId',
    ],
    allowedFilter: [
      'userId',
      'galleryId',
      'artId',
      'botId',
      'componentId',
      'pitchId',
      'promptId',
      'reactionId',
      'resourceId',
      'rewardId',
      'tagId',
      'chatId',
      'characterId',
    ],
    views: {
      minimal: { select: { id: true, artId: true } },
      card: {
        select: {
          id: true,
          fileName: true,
          fileType: true,
          artId: true,
          createdAt: true,
        },
      },
      detail: {
        select: {
          id: true,
          imageData: true,
          fileName: true,
          fileType: true,
          artId: true,
          galleryId: true,
          userId: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
  },

  Pitch: {
    delegate: prisma.pitch,
    allowedWrite: [
      'pitch',
      'title',
      'flavorText',
      'PitchType',
      'isPublic',
      'isMature',
      'imagePrompt',
      'description',
      'artImageId',
      'examples',
      'icon',
      'designer',
    ],
    allowedFilter: ['userId', 'PitchType', 'isPublic', 'isMature', 'title'],
    views: {
      minimal: { select: { id: true, title: true } },
      card: {
        include: {
          ArtImage: { select: { id: true } },
          User: { select: { id: true, username: true } },
        },
      },
      detail: {
        include: {
          Art: { select: { id: true, artImageId: true } },
          Prompts: true,
          User: true,
          ArtImage: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
    onCreate(data, user) {
      if (!data.designer) data.designer = user?.designerName || user?.username
      return data
    },
  },

  Prompt: {
    delegate: prisma.prompt,
    allowedWrite: [
      'prompt',
      'userId',
      'galleryId',
      'pitchId',
      'botId',
      'artImageId',
    ],
    allowedFilter: ['userId', 'botId', 'pitchId', 'galleryId'],
    views: {
      minimal: { select: { id: true } },
      card: {
        select: {
          id: true,
          createdAt: true,
          prompt: true,
          botId: true,
          pitchId: true,
        },
      },
      detail: {
        include: { Bot: true, Pitch: true, Gallery: true, User: true },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
  },

  Chat: {
    delegate: prisma.chat,
    allowedWrite: [
      'type',
      'recipient',
      'content',
      'title',
      'isPublic',
      'isFavorite',
      'previousEntryId',
      'originId',
      'botId',
      'recipientId',
      'artImageId',
      'promptId',
      'botName',
      'channel',
      'botResponse',
      'characterId',
      'isRead',
      'isMature',
    ],
    allowedFilter: [
      'userId',
      'botId',
      'characterId',
      'originId',
      'channel',
      'isPublic',
      'isMature',
    ],
    views: {
      minimal: { select: { id: true, createdAt: true } },
      card: {
        select: {
          id: true,
          createdAt: true,
          type: true,
          content: true,
          title: true,
          originId: true,
          botId: true,
          characterId: true,
          channel: true,
        },
      },
      detail: {
        include: {
          Bot: true,
          Character: true,
          Prompt: true,
          User: true,
          ArtImage: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
    onCreate(data, user) {
      if (!data.sender) data.sender = user?.username
      if (data.isRead === undefined) data.isRead = false
      return data
    },
  },

  Scenario: {
    delegate: prisma.scenario,
    allowedWrite: [
      'title',
      'description',
      'intros',
      'userId',
      'artImageId',
      'imagePath',
      'locations',
      'artPrompt',
      'genres',
      'inspirations',
    ],
    allowedFilter: ['userId', 'title', 'genres'],
    views: {
      minimal: { select: { id: true, title: true } },
      card: {
        select: { id: true, title: true, createdAt: true, artImageId: true },
      },
      detail: { include: { ArtImage: true, User: true, Characters: true } },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
  },

  SmartIcon: {
    delegate: prisma.smartIcon,
    allowedWrite: [
      'title',
      'type',
      'designer',
      'userId',
      'icon',
      'label',
      'link',
      'component',
      'isPublic',
      'description',
    ],
    allowedFilter: ['userId', 'isPublic', 'type', 'title'],
    views: {
      minimal: { select: { id: true, title: true } },
      card: {
        select: {
          id: true,
          title: true,
          type: true,
          icon: true,
          label: true,
          link: true,
          isPublic: true,
        },
      },
      detail: {
        select: {
          id: true,
          title: true,
          type: true,
          icon: true,
          label: true,
          link: true,
          component: true,
          isPublic: true,
          description: true,
          userId: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
  },

  Theme: {
    delegate: prisma.theme,
    allowedWrite: [
      'name',
      'values',
      'userId',
      'isPublic',
      'tagline',
      'room',
      'colorScheme',
      'prefersDark',
    ],
    allowedFilter: ['userId', 'isPublic', 'name', 'colorScheme'],
    views: {
      minimal: { select: { id: true, name: true } },
      card: {
        select: {
          id: true,
          name: true,
          colorScheme: true,
          prefersDark: true,
          isPublic: true,
        },
      },
      detail: {
        select: {
          id: true,
          name: true,
          values: true,
          tagline: true,
          room: true,
          colorScheme: true,
          prefersDark: true,
          isPublic: true,
          userId: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
  },

  Character: {
    delegate: prisma.character,
    allowedWrite: [
      'name',
      'achievements',
      'alignment',
      'experience',
      'level',
      'class',
      'species',
      'backstory',
      'drive',
      'inventory',
      'statName1',
      'statValue1',
      'statName2',
      'statValue2',
      'statName3',
      'statValue3',
      'statName4',
      'statValue4',
      'statName5',
      'statValue5',
      'statName6',
      'statValue6',
      'quirks',
      'skills',
      'genre',
      'artImageId',
      'isPublic',
      'artPrompt',
      'goalStat1Name',
      'goalStat1Value',
      'goalStat2Name',
      'goalStat2Value',
      'goalStat3Name',
      'goalStat3Value',
      'goalStat4Name',
      'goalStat4Value',
      'honorific',
      'imagePath',
      'designer',
      'personality',
    ],
    allowedFilter: ['userId', 'isPublic', 'name', 'genre', 'designer'],
    views: {
      minimal: { select: { id: true, name: true } },
      card: {
        select: {
          id: true,
          name: true,
          class: true,
          species: true,
          artImageId: true,
          isPublic: true,
          createdAt: true,
        },
      },
      detail: {
        include: { ArtImage: true, User: true, Rewards: true, Scenarios: true },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
  },

  Component: {
    delegate: prisma.component,
    allowedWrite: [
      'folderName',
      'componentName',
      'isWorking',
      'underConstruction',
      'isBroken',
      'title',
      'notes',
      'artImageId',
    ],
    allowedFilter: [
      'componentName',
      'isWorking',
      'underConstruction',
      'isBroken',
    ],
    views: {
      minimal: { select: { id: true, componentName: true } },
      card: {
        select: {
          id: true,
          componentName: true,
          folderName: true,
          isWorking: true,
          underConstruction: true,
          isBroken: true,
          createdAt: true,
        },
      },
      detail: { include: { ArtImage: true, Reactions: true, Tags: true } },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: false,
    requireOwnerOnDelete: false,
    attachUserOnCreate: false,
  },

  Reaction: {
    delegate: prisma.reaction,
    allowedWrite: [
      'comment',
      'userId',
      'artId',
      'pitchId',
      'componentId',
      'reactionType',
      'reactionCategory',
      'rating',
      'artImageId',
      'botId',
      'galleryId',
      'promptId',
      'resourceId',
      'rewardId',
      'tagId',
      'chatId',
    ],
    allowedFilter: [
      'userId',
      'reactionType',
      'reactionCategory',
      'artId',
      'pitchId',
      'botId',
      'chatId',
      'galleryId',
      'promptId',
      'resourceId',
      'rewardId',
      'tagId',
    ],
    views: {
      minimal: { select: { id: true, reactionType: true } },
      card: {
        select: {
          id: true,
          reactionType: true,
          rating: true,
          comment: true,
          createdAt: true,
          userId: true,
        },
      },
      detail: {
        include: {
          User: true,
          Art: true,
          ArtImage: true,
          Pitch: true,
          Prompt: true,
          Bot: true,
          Gallery: true,
          Resource: true,
          Reward: true,
          Tag: true,
          Chat: true,
          Component: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
  },

  Resource: {
    delegate: prisma.resource,
    allowedWrite: [
      'name',
      'customLabel',
      'MediaPath',
      'customUrl',
      'civitaiUrl',
      'huggingUrl',
      'localPath',
      'description',
      'isMature',
      'resourceType',
      'userId',
      'artImageId',
      'generation',
    ],
    allowedFilter: ['userId', 'resourceType', 'isMature', 'name'],
    views: {
      minimal: { select: { id: true, name: true } },
      card: {
        select: {
          id: true,
          name: true,
          resourceType: true,
          isMature: true,
          customLabel: true,
        },
      },
      detail: { include: { ArtImage: true, User: true, Reactions: true } },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
  },

  Reward: {
    delegate: prisma.reward,
    allowedWrite: [
      'icon',
      'text',
      'power',
      'collection',
      'rarity',
      'label',
      'userId',
      'artImageId',
      'imagePath',
      'imagePrompt',
    ],
    allowedFilter: ['userId', 'collection', 'rarity', 'label'],
    views: {
      minimal: { select: { id: true, label: true } },
      card: {
        select: {
          id: true,
          label: true,
          icon: true,
          rarity: true,
          collection: true,
          createdAt: true,
        },
      },
      detail: {
        include: {
          ArtImage: true,
          User: true,
          Reactions: true,
          Characters: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
  },

  Tag: {
    delegate: prisma.tag,
    allowedWrite: [
      'label',
      'title',
      'flavorText',
      'pitch',
      'isPublic',
      'isMature',
      'userId',
      'artImageId',
    ],
    allowedFilter: ['userId', 'isPublic', 'isMature', 'label', 'title'],
    views: {
      minimal: { select: { id: true, label: true } },
      card: {
        select: {
          id: true,
          label: true,
          title: true,
          isPublic: true,
          isMature: true,
        },
      },
      detail: {
        include: {
          ArtImage: true,
          User: true,
          Reactions: true,
          Components: true,
          Dominions: true,
          Pitches: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
  },

  Gallery: {
    delegate: prisma.gallery,
    allowedWrite: [
      'name',
      'description',
      'url',
      'custodian',
      'content',
      'highlightImage',
      'imagePaths',
      'isMature',
      'userId',
      'isPublic',
    ],
    allowedFilter: ['userId', 'isPublic', 'isMature', 'name'],
    views: {
      minimal: { select: { id: true, name: true } },
      card: {
        select: {
          id: true,
          name: true,
          isPublic: true,
          isMature: true,
          highlightImage: true,
          createdAt: true,
        },
      },
      detail: {
        include: {
          Art: { select: { id: true, artImageId: true } },
          ArtImage: { select: { id: true } },
          User: true,
          Prompts: true,
          Reactions: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
  },
}

// ---------------- generic handlers ----------------
async function handleCreate(user: any, payload: any) {
  if (!isObject(payload)) fail('Invalid payload')
  const { model, data } = payload
  if (typeof model !== 'string') fail('Missing model')
  const cfg = R[model as ModelKey]
  if (!cfg) fail(`Model not registered: ${model}`)
  if (cfg.requireAuthOnCreate) requireUser(user)
  if (!isObject(data)) fail('Missing data')

  let toCreate = pick<Record<string, any>>(data, cfg.allowedWrite)
  if (cfg.attachUserOnCreate && user)
    toCreate.userId = toCreate.userId ?? user.id
  if (cfg.onCreate) toCreate = cfg.onCreate(toCreate, user)

  return cfg.delegate.create({ data: toCreate })
}

async function handleUpdate(user: any, payload: any) {
  if (!isObject(payload)) fail('Invalid payload')
  const { model, id, data } = payload
  if (typeof model !== 'string') fail('Missing model')
  const cfg = R[model as ModelKey]
  if (!cfg) fail(`Model not registered: ${model}`)
  if (typeof id !== 'number' || id <= 0) fail('Invalid id')
  if (!isObject(data)) fail('Missing data')

  if (cfg.requireOwnerOnUpdate) {
    requireUser(user)
    const existing = await cfg.delegate.findUnique({ where: { id } })
    if (!existing) fail('Not found', 404)
    if (
      'userId' in existing &&
      existing.userId !== user.id &&
      user.Role !== 'ADMIN'
    )
      fail('Forbidden', 403)
  }

  const toUpdate = pick<Record<string, any>>(data, cfg.allowedWrite)
  return cfg.delegate.update({ where: { id }, data: toUpdate })
}

async function handleGet(_user: any, payload: any) {
  if (!isObject(payload)) fail('Invalid payload')
  const { model, id, view } = payload
  if (typeof model !== 'string') fail('Missing model')
  const cfg = R[model as ModelKey]
  if (!cfg) fail(`Model not registered: ${model}`)
  if (typeof id !== 'number' || id <= 0) fail('Invalid id')
  const v: ViewName =
    view === 'minimal' || view === 'card' || view === 'detail' ? view : 'detail'
  const selectOrInclude = cfg.views[v] || cfg.views.detail
  const record = await cfg.delegate.findUnique({
    where: { id },
    ...selectOrInclude,
  })
  if (!record) fail('Not found', 404)
  return record
}

async function handleList(_user: any, payload: any) {
  if (!isObject(payload)) fail('Invalid payload')
  const { model } = payload
  if (typeof model !== 'string') fail('Missing model')
  const cfg = R[model as ModelKey]
  if (!cfg) fail(`Model not registered: ${model}`)

  const where = isObject(payload.where) ? payload.where : {}
  const w = pick<Record<string, any>>(where, cfg.allowedFilter)
  const take = clamp(payload.take, 1, 100, 24)
  const skip = clamp(payload.skip, 0, 10_000, 0)
  const view: ViewName =
    payload.view === 'minimal' ||
    payload.view === 'card' ||
    payload.view === 'detail'
      ? payload.view
      : 'card'
  const selectOrInclude = cfg.views[view] || cfg.views.card
  const orderBy = isObject(payload.orderBy)
    ? payload.orderBy
    : { createdAt: 'desc' }

  return cfg.delegate.findMany({
    where: w,
    take,
    skip,
    orderBy,
    ...selectOrInclude,
  })
}

async function handleDelete(user: any, payload: any) {
  if (!isObject(payload)) fail('Invalid payload')
  const { model, id } = payload
  if (typeof model !== 'string') fail('Missing model')
  const cfg = R[model as ModelKey]
  if (!cfg) fail(`Model not registered: ${model}`)
  if (typeof id !== 'number' || id <= 0) fail('Invalid id')

  if (cfg.requireOwnerOnDelete) {
    requireUser(user)
    const existing = await cfg.delegate.findUnique({ where: { id } })
    if (!existing) fail('Not found', 404)
    if (
      'userId' in existing &&
      existing.userId !== user.id &&
      user.Role !== 'ADMIN'
    )
      fail('Forbidden', 403)
  }
  return cfg.delegate.delete({ where: { id } })
}

// ---------------- named action runner ----------------
export async function runAction(
  action: string,
  input: any,
  headers: RunActionHeaders,
) {
  const { user } = await validateSession(headers)
  switch (action) {
    case 'kr.create':
      return ok(await handleCreate(user, input))
    case 'kr.update':
      return ok(await handleUpdate(user, input))
    case 'kr.get':
      return ok(await handleGet(user, input))
    case 'kr.list':
      return ok(await handleList(user, input))
    case 'kr.delete':
      return ok(await handleDelete(user, input))
    default:
      fail(`Unknown action: ${action}`, 400)
  }
}

// ---------------- default HTTP handler ----------------

// Type predicate: proves to TS that body has a string action
function hasAction(b: unknown): b is { action: string; input?: any } {
  return (
    !!b && typeof (b as any).action === 'string' && (b as any).action.length > 0
  )
}

export default defineEventHandler(async (event) => {
  // Normalize headers to RunActionHeaders (string | undefined only)
  const raw = getHeaders(event)
  const headers: RunActionHeaders = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  )

  const body = await readBody(event)

  if (!hasAction(body)) {
    fail('Missing action', 400)
  }

  // After the predicate, TS knows body.action is string
  const actionStr: string = body.action
  const input = body.input ?? {}

  return runAction(actionStr, input, headers)
})
