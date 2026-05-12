// /server/api/chatgpt/_utils/actionRegistry.ts
import prisma from '../../../utils/prisma'
import {
  type ChatGptActionHeaders,
  type ChatGptSession,
  fail,
  isAdmin,
  requireOwnerOrAdmin,
  requireUser,
  resolveChatGptSession,
} from './access'
import { isRecord } from './validate'

type ViewName = 'minimal' | 'card' | 'detail'

type ModelKey =
  | 'Art'
  | 'ArtImage'
  | 'Bot'
  | 'Pitch'
  | 'Prompt'
  | 'Chat'
  | 'Dream'
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
  views: Record<ViewName, any>
  requireAuthOnCreate?: boolean
  requireOwnerOnUpdate?: boolean
  requireOwnerOnDelete?: boolean
  attachUserOnCreate?: boolean
  ownerField?: string
  publicField?: string
  matureField?: string
  activeField?: string
  onCreate?: (
    data: Record<string, unknown>,
    session: ChatGptSession,
  ) => Record<string, unknown>
}

function ok<T>(data: T) {
  return {
    ok: true,
    data,
  }
}

function pick(source: Record<string, unknown>, allowedKeys: readonly string[]) {
  const output: Record<string, unknown> = {}

  for (const key of allowedKeys) {
    if (key in source) {
      output[key] = source[key]
    }
  }

  return output
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numberValue)) return fallback

  return Math.min(Math.max(numberValue, min), max)
}

function getView(value: unknown, fallback: ViewName): ViewName {
  if (value === 'minimal' || value === 'card' || value === 'detail') {
    return value
  }

  return fallback
}

function getRegistryItem(model: unknown) {
  if (typeof model !== 'string') {
    fail('Missing model', 400)
  }

  const item = registry[model as ModelKey]

  if (!item) {
    fail(`Model not registered: ${model}`, 400)
  }

  return item
}

function getOwnerId(record: any, ownerField = 'userId') {
  const value = record?.[ownerField]

  return typeof value === 'number' ? value : null
}

function enforceReadableRecord(
  session: ChatGptSession,
  cfg: RegistryItem,
  record: any,
) {
  if (!record) {
    fail('Not found', 404)
  }

  if (session.user && isAdmin(session.user)) return

  const ownerField = cfg.ownerField ?? 'userId'
  const publicField = cfg.publicField ?? 'isPublic'
  const ownerId = getOwnerId(record, ownerField)
  const isOwner = Boolean(
    session.userId && ownerId && session.userId === ownerId,
  )

  if (isOwner) return

  if (publicField in record && record[publicField] === true) return

  if (!(publicField in record)) return

  fail('Not found', 404)
}

function buildPublicWhere(
  session: ChatGptSession,
  cfg: RegistryItem,
  requestedWhere: Record<string, unknown>,
) {
  const where = pick(requestedWhere, cfg.allowedFilter)
  const publicField = cfg.publicField ?? 'isPublic'
  const matureField = cfg.matureField ?? 'isMature'
  const activeField = cfg.activeField

  if (session.user && isAdmin(session.user)) {
    return where
  }

  if (publicField && cfg.allowedFilter.includes(publicField)) {
    where[publicField] = true
  }

  if (matureField && cfg.allowedFilter.includes(matureField)) {
    where[matureField] = false
  }

  if (activeField && cfg.allowedFilter.includes(activeField)) {
    where[activeField] = true
  }

  return where
}

const registry: Record<ModelKey, RegistryItem> = {
  Dream: {
    delegate: prisma.dream,
    allowedWrite: [
      'title',
      'slug',
      'description',
      'currentVibe',
      'currentPrompt',
      'artCollectionId',
      'scenarioId',
      'textServerId',
      'artServerId',
      'isPublic',
      'isMature',
      'isActive',
    ],
    allowedFilter: [
      'id',
      'userId',
      'slug',
      'title',
      'isPublic',
      'isMature',
      'isActive',
      'artCollectionId',
      'scenarioId',
    ],
    views: {
      minimal: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      card: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          currentVibe: true,
          currentPrompt: true,
          isPublic: true,
          isMature: true,
          isActive: true,
          userId: true,
          artCollectionId: true,
          scenarioId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      detail: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          currentVibe: true,
          currentPrompt: true,
          isPublic: true,
          isMature: true,
          isActive: true,
          userId: true,
          artCollectionId: true,
          scenarioId: true,
          textServerId: true,
          artServerId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
    activeField: 'isActive',
  },

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
      'id',
      'userId',
      'galleryId',
      'pitchId',
      'isPublic',
      'isMature',
      'designer',
    ],
    views: {
      minimal: {
        select: {
          id: true,
        },
      },
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
          galleryId: true,
          artImageId: true,
          imagePath: true,
          designer: true,
        },
      },
      detail: {
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          promptString: true,
          negativePrompt: true,
          checkpoint: true,
          sampler: true,
          seed: true,
          steps: true,
          cfg: true,
          cfgHalf: true,
          pitchId: true,
          promptId: true,
          genres: true,
          isPublic: true,
          isMature: true,
          galleryId: true,
          path: true,
          imagePath: true,
          designer: true,
          artImageId: true,
          userId: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
    onCreate(data, session) {
      if (!data.designer && session.user) {
        data.designer = session.user.designerName || session.user.username
      }

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
      'id',
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
      minimal: {
        select: {
          id: true,
          artId: true,
        },
      },
      card: {
        select: {
          id: true,
          fileName: true,
          fileType: true,
          artId: true,
          galleryId: true,
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
    publicField: '',
  },

  Bot: {
    delegate: prisma.bot,
    allowedWrite: [
      'name',
      'subtitle',
      'description',
      'personality',
      'prompt',
      'avatar',
      'avatarImage',
      'imagePath',
      'artImageId',
      'isPublic',
      'isMature',
      'designer',
    ],
    allowedFilter: ['id', 'userId', 'name', 'designer', 'isPublic', 'isMature'],
    views: {
      minimal: {
        select: {
          id: true,
          name: true,
        },
      },
      card: {
        select: {
          id: true,
          name: true,
          subtitle: true,
          description: true,
          avatar: true,
          avatarImage: true,
          imagePath: true,
          artImageId: true,
          isPublic: true,
          isMature: true,
          userId: true,
          designer: true,
          createdAt: true,
        },
      },
      detail: {
        select: {
          id: true,
          name: true,
          subtitle: true,
          description: true,
          personality: true,
          prompt: true,
          avatar: true,
          avatarImage: true,
          imagePath: true,
          artImageId: true,
          isPublic: true,
          isMature: true,
          userId: true,
          designer: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
    onCreate(data, session) {
      if (!data.designer && session.user) {
        data.designer = session.user.designerName || session.user.username
      }

      return data
    },
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
    allowedFilter: [
      'id',
      'userId',
      'PitchType',
      'isPublic',
      'isMature',
      'title',
    ],
    views: {
      minimal: {
        select: {
          id: true,
          title: true,
        },
      },
      card: {
        select: {
          id: true,
          title: true,
          pitch: true,
          flavorText: true,
          PitchType: true,
          isPublic: true,
          isMature: true,
          artImageId: true,
          designer: true,
          userId: true,
        },
      },
      detail: {
        select: {
          id: true,
          title: true,
          pitch: true,
          flavorText: true,
          PitchType: true,
          isPublic: true,
          isMature: true,
          imagePrompt: true,
          description: true,
          artImageId: true,
          examples: true,
          icon: true,
          designer: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
    onCreate(data, session) {
      if (!data.designer && session.user) {
        data.designer = session.user.designerName || session.user.username
      }

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
    allowedFilter: ['id', 'userId', 'botId', 'pitchId', 'galleryId'],
    views: {
      minimal: {
        select: {
          id: true,
        },
      },
      card: {
        select: {
          id: true,
          createdAt: true,
          prompt: true,
          botId: true,
          pitchId: true,
          galleryId: true,
        },
      },
      detail: {
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          prompt: true,
          userId: true,
          galleryId: true,
          pitchId: true,
          botId: true,
          artImageId: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
    publicField: '',
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
      'id',
      'userId',
      'botId',
      'characterId',
      'originId',
      'channel',
      'isPublic',
      'isMature',
    ],
    views: {
      minimal: {
        select: {
          id: true,
          createdAt: true,
        },
      },
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
          isPublic: true,
          isMature: true,
          userId: true,
        },
      },
      detail: {
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          type: true,
          recipient: true,
          content: true,
          title: true,
          isPublic: true,
          isFavorite: true,
          previousEntryId: true,
          originId: true,
          botId: true,
          recipientId: true,
          artImageId: true,
          promptId: true,
          botName: true,
          channel: true,
          botResponse: true,
          characterId: true,
          isRead: true,
          isMature: true,
          userId: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
    onCreate(data, session) {
      if (!data.sender && session.user) {
        data.sender = session.user.username
      }

      if (data.isRead === undefined) {
        data.isRead = false
      }

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
      'isPublic',
      'isMature',
    ],
    allowedFilter: ['id', 'userId', 'title', 'genres', 'isPublic', 'isMature'],
    views: {
      minimal: {
        select: {
          id: true,
          title: true,
        },
      },
      card: {
        select: {
          id: true,
          title: true,
          description: true,
          artImageId: true,
          imagePath: true,
          isPublic: true,
          isMature: true,
          userId: true,
          createdAt: true,
        },
      },
      detail: {
        select: {
          id: true,
          title: true,
          description: true,
          intros: true,
          artImageId: true,
          imagePath: true,
          locations: true,
          artPrompt: true,
          genres: true,
          inspirations: true,
          isPublic: true,
          isMature: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
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
    allowedFilter: ['id', 'userId', 'isPublic', 'type', 'title'],
    views: {
      minimal: {
        select: {
          id: true,
          title: true,
        },
      },
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
    allowedFilter: ['id', 'userId', 'isPublic', 'name', 'colorScheme'],
    views: {
      minimal: {
        select: {
          id: true,
          name: true,
        },
      },
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
    allowedFilter: ['id', 'userId', 'isPublic', 'name', 'genre', 'designer'],
    views: {
      minimal: {
        select: {
          id: true,
          name: true,
        },
      },
      card: {
        select: {
          id: true,
          name: true,
          class: true,
          species: true,
          genre: true,
          artImageId: true,
          imagePath: true,
          isPublic: true,
          userId: true,
          createdAt: true,
        },
      },
      detail: {
        select: {
          id: true,
          name: true,
          achievements: true,
          alignment: true,
          experience: true,
          level: true,
          class: true,
          species: true,
          backstory: true,
          drive: true,
          inventory: true,
          quirks: true,
          skills: true,
          genre: true,
          artImageId: true,
          isPublic: true,
          artPrompt: true,
          honorific: true,
          imagePath: true,
          designer: true,
          personality: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
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
      'id',
      'componentName',
      'isWorking',
      'underConstruction',
      'isBroken',
    ],
    views: {
      minimal: {
        select: {
          id: true,
          componentName: true,
        },
      },
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
      detail: {
        select: {
          id: true,
          componentName: true,
          folderName: true,
          isWorking: true,
          underConstruction: true,
          isBroken: true,
          title: true,
          notes: true,
          artImageId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: false,
    requireOwnerOnDelete: false,
    attachUserOnCreate: false,
    publicField: '',
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
      'id',
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
      minimal: {
        select: {
          id: true,
          reactionType: true,
        },
      },
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
        select: {
          id: true,
          comment: true,
          userId: true,
          artId: true,
          pitchId: true,
          componentId: true,
          reactionType: true,
          reactionCategory: true,
          rating: true,
          artImageId: true,
          botId: true,
          galleryId: true,
          promptId: true,
          resourceId: true,
          rewardId: true,
          tagId: true,
          chatId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
    publicField: '',
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
    allowedFilter: ['id', 'userId', 'resourceType', 'isMature', 'name'],
    views: {
      minimal: {
        select: {
          id: true,
          name: true,
        },
      },
      card: {
        select: {
          id: true,
          name: true,
          resourceType: true,
          isMature: true,
          customLabel: true,
          MediaPath: true,
        },
      },
      detail: {
        select: {
          id: true,
          name: true,
          customLabel: true,
          MediaPath: true,
          customUrl: true,
          civitaiUrl: true,
          huggingUrl: true,
          localPath: true,
          description: true,
          isMature: true,
          resourceType: true,
          userId: true,
          artImageId: true,
          generation: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
    publicField: '',
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
    allowedFilter: ['id', 'userId', 'collection', 'rarity', 'label'],
    views: {
      minimal: {
        select: {
          id: true,
          label: true,
        },
      },
      card: {
        select: {
          id: true,
          label: true,
          icon: true,
          rarity: true,
          collection: true,
          imagePath: true,
          createdAt: true,
        },
      },
      detail: {
        select: {
          id: true,
          icon: true,
          text: true,
          power: true,
          collection: true,
          rarity: true,
          label: true,
          userId: true,
          artImageId: true,
          imagePath: true,
          imagePrompt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
    publicField: '',
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
    allowedFilter: ['id', 'userId', 'isPublic', 'isMature', 'label', 'title'],
    views: {
      minimal: {
        select: {
          id: true,
          label: true,
        },
      },
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
        select: {
          id: true,
          label: true,
          title: true,
          flavorText: true,
          pitch: true,
          isPublic: true,
          isMature: true,
          userId: true,
          artImageId: true,
          createdAt: true,
          updatedAt: true,
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
    allowedFilter: ['id', 'userId', 'isPublic', 'isMature', 'name'],
    views: {
      minimal: {
        select: {
          id: true,
          name: true,
        },
      },
      card: {
        select: {
          id: true,
          name: true,
          description: true,
          isPublic: true,
          isMature: true,
          highlightImage: true,
          createdAt: true,
        },
      },
      detail: {
        select: {
          id: true,
          name: true,
          description: true,
          url: true,
          custodian: true,
          content: true,
          highlightImage: true,
          imagePaths: true,
          isMature: true,
          userId: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
  },
}

async function handleCreate(session: ChatGptSession, payload: unknown) {
  if (!isRecord(payload)) fail('Invalid payload', 400)

  const cfg = getRegistryItem(payload.model)

  if (cfg.requireAuthOnCreate) {
    requireUser(session)
  }

  if (!isRecord(payload.data)) {
    fail('Missing data', 400)
  }

  let data = pick(payload.data, cfg.allowedWrite)

  if (cfg.attachUserOnCreate && session.userId) {
    data.userId = session.userId
  }

  if (cfg.onCreate) {
    data = cfg.onCreate(data, session)
  }

  return cfg.delegate.create({ data })
}

async function handleUpdate(session: ChatGptSession, payload: unknown) {
  if (!isRecord(payload)) fail('Invalid payload', 400)

  const cfg = getRegistryItem(payload.model)
  const id = clamp(payload.id, 1, Number.MAX_SAFE_INTEGER, 0)

  if (!id) fail('Invalid id', 400)

  if (!isRecord(payload.data)) {
    fail('Missing data', 400)
  }

  if (cfg.requireOwnerOnUpdate) {
    requireUser(session)

    const existing = await cfg.delegate.findUnique({
      where: { id },
    })

    if (!existing) fail('Not found', 404)

    requireOwnerOrAdmin(
      session,
      getOwnerId(existing, cfg.ownerField ?? 'userId'),
    )
  }

  const data = pick(payload.data, cfg.allowedWrite)

  return cfg.delegate.update({
    where: { id },
    data,
  })
}

async function handleGet(session: ChatGptSession, payload: unknown) {
  if (!isRecord(payload)) fail('Invalid payload', 400)

  const cfg = getRegistryItem(payload.model)
  const id = clamp(payload.id, 1, Number.MAX_SAFE_INTEGER, 0)

  if (!id) fail('Invalid id', 400)

  const view = getView(payload.view, 'detail')
  const selectOrInclude = cfg.views[view] || cfg.views.detail

  const record = await cfg.delegate.findUnique({
    where: { id },
    ...selectOrInclude,
  })

  enforceReadableRecord(session, cfg, record)

  return record
}

async function handleList(session: ChatGptSession, payload: unknown) {
  if (!isRecord(payload)) fail('Invalid payload', 400)

  const cfg = getRegistryItem(payload.model)
  const requestedWhere = isRecord(payload.where) ? payload.where : {}
  const where = buildPublicWhere(session, cfg, requestedWhere)
  const take = clamp(payload.take, 1, 100, 24)
  const skip = clamp(payload.skip, 0, 10_000, 0)
  const view = getView(payload.view, 'card')
  const selectOrInclude = cfg.views[view] || cfg.views.card
  const orderBy = isRecord(payload.orderBy)
    ? payload.orderBy
    : { createdAt: 'desc' }

  return cfg.delegate.findMany({
    where,
    take,
    skip,
    orderBy,
    ...selectOrInclude,
  })
}

async function handleListMine(session: ChatGptSession, payload: unknown) {
  if (!isRecord(payload)) fail('Invalid payload', 400)

  requireUser(session)

  const cfg = getRegistryItem(payload.model)
  const requestedWhere = isRecord(payload.where) ? payload.where : {}
  const ownerField = cfg.ownerField ?? 'userId'
  const where = pick(requestedWhere, cfg.allowedFilter)

  where[ownerField] = session.userId

  const take = clamp(payload.take, 1, 100, 24)
  const skip = clamp(payload.skip, 0, 10_000, 0)
  const view = getView(payload.view, 'card')
  const selectOrInclude = cfg.views[view] || cfg.views.card
  const orderBy = isRecord(payload.orderBy)
    ? payload.orderBy
    : { createdAt: 'desc' }

  return cfg.delegate.findMany({
    where,
    take,
    skip,
    orderBy,
    ...selectOrInclude,
  })
}

async function handleDelete(session: ChatGptSession, payload: unknown) {
  if (!isRecord(payload)) fail('Invalid payload', 400)

  const cfg = getRegistryItem(payload.model)
  const id = clamp(payload.id, 1, Number.MAX_SAFE_INTEGER, 0)

  if (!id) fail('Invalid id', 400)

  if (cfg.requireOwnerOnDelete) {
    requireUser(session)

    const existing = await cfg.delegate.findUnique({
      where: { id },
    })

    if (!existing) fail('Not found', 404)

    requireOwnerOrAdmin(
      session,
      getOwnerId(existing, cfg.ownerField ?? 'userId'),
    )
  }

  return cfg.delegate.delete({
    where: { id },
  })
}

export async function runRegistryAction(
  action: string,
  input: unknown,
  headers: ChatGptActionHeaders,
) {
  const session = await resolveChatGptSession(headers)

  switch (action) {
    case 'kr.create':
      return ok(await handleCreate(session, input))

    case 'kr.update':
      return ok(await handleUpdate(session, input))

    case 'kr.get':
      return ok(await handleGet(session, input))

    case 'kr.list':
      return ok(await handleList(session, input))

    case 'kr.listMine':
      return ok(await handleListMine(session, input))

    case 'kr.delete':
      return ok(await handleDelete(session, input))

    default:
      fail(`Unknown registry action: ${action}`, 400)
  }
}
