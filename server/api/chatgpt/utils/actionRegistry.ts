// /server/api/chatgpt/utils/actionRegistry.ts
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
import {
  publicArtCollectionSelect,
  publicArtImageSelect,
  publicArtSelect,
  publicBotSelect,
  publicButterflySelect,
  publicCharacterSelect,
  publicChatSelect,
  publicComponentSelect,
  publicDreamSelect,
  publicGallerySelect,
  publicPitchSelect,
  publicPromptSelect,
  publicReactionSelect,
  publicResourceSelect,
  publicRewardSelect,
  publicScenarioSelect,
  publicSmartIconSelect,
  publicTagSelect,
  publicThemeSelect,
} from './contracts'

type ModelKey =
  | 'Art'
  | 'ArtCollection'
  | 'ArtImage'
  | 'Bot'
  | 'Butterfly'
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

type RequiredViewName = 'minimal' | 'card' | 'detail'
type ViewName = RequiredViewName | 'full'

type RegistryItem = {
  delegate: any
  allowedWrite: readonly string[]
  allowedFilter: readonly string[]
  views: Record<RequiredViewName, any> & Partial<Record<'full', any>>
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
  if (
    value === 'minimal' ||
    value === 'card' ||
    value === 'detail' ||
    value === 'full'
  ) {
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

  if (!publicField) return

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

function minimalSelect(fields: string[]) {
  return {
    select: fields.reduce<Record<string, true>>((output, field) => {
      output[field] = true
      return output
    }, {}),
  }
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
      'userId',
      'pitchId',
      'artId',
      'artImageId',
      'textServerId',
      'artServerId',
      'artCollectionId',
      'galleryId',
      'scenarioId',
      'accessMode',
      'privacyCode',
      'isPublic',
      'isMature',
      'isActive',
    ],
    allowedFilter: [
      'id',
      'userId',
      'slug',
      'title',
      'pitchId',
      'artId',
      'artImageId',
      'artCollectionId',
      'galleryId',
      'scenarioId',
      'accessMode',
      'isPublic',
      'isMature',
      'isActive',
    ],
    views: {
      minimal: minimalSelect(['id', 'title', 'slug']),
      card: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          currentVibe: true,
          currentPrompt: true,
          artImageId: true,
          artCollectionId: true,
          scenarioId: true,
          isPublic: true,
          isMature: true,
          isActive: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      detail: {
        select: publicDreamSelect,
      },
      full: {
        include: {
          User: {
            select: {
              id: true,
              username: true,
              avatarImage: true,
            },
          },
          Pitch: true,
          Art: {
            select: publicArtSelect,
          },
          ArtImage: {
            select: publicArtImageSelect,
          },
          ArtCollection: {
            include: {
              art: {
                select: publicArtSelect,
              },
            },
          },
          Gallery: {
            select: publicGallerySelect,
          },
          Scenario: {
            select: publicScenarioSelect,
          },
          Characters: {
            select: publicCharacterSelect,
          },
          Rewards: {
            select: publicRewardSelect,
          },
          Tags: {
            select: publicTagSelect,
          },
          Reactions: {
            select: publicReactionSelect,
          },
          Chats: {
            take: 20,
            orderBy: {
              createdAt: 'desc',
            },
            select: publicChatSelect,
          },
          _count: {
            select: {
              Chats: true,
              Reactions: true,
              Characters: true,
              Rewards: true,
            },
          },
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
      'path',
      'checkpoint',
      'checkpointResourceId',
      'sampler',
      'seed',
      'steps',
      'designer',
      'isPublic',
      'isMature',
      'promptId',
      'pitchId',
      'galleryId',
      'promptString',
      'cfg',
      'cfgHalf',
      'serverId',
      'serverName',
      'serverUrl',
      'artImageId',
      'imagePath',
      'genres',
      'negativePrompt',
    ],
    allowedFilter: [
      'id',
      'userId',
      'galleryId',
      'pitchId',
      'promptId',
      'serverId',
      'artImageId',
      'checkpointResourceId',
      'isPublic',
      'isMature',
      'designer',
    ],
    views: {
      minimal: minimalSelect(['id']),
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
        select: publicArtSelect,
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

  ArtCollection: {
    delegate: prisma.artCollection,
    allowedWrite: [
      'userId',
      'label',
      'isMature',
      'isPublic',
      'description',
      'username',
    ],
    allowedFilter: [
      'id',
      'userId',
      'label',
      'username',
      'isPublic',
      'isMature',
    ],
    views: {
      minimal: minimalSelect(['id', 'label']),
      card: {
        select: {
          id: true,
          label: true,
          description: true,
          username: true,
          isPublic: true,
          isMature: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      detail: {
        select: publicArtCollectionSelect,
      },
      full: {
        include: {
          art: {
            select: publicArtSelect,
          },
          Dreams: {
            select: publicDreamSelect,
          },
          Reactions: {
            select: publicReactionSelect,
          },
        },
      },
    },
    requireAuthOnCreate: true,
    requireOwnerOnUpdate: true,
    requireOwnerOnDelete: true,
    attachUserOnCreate: true,
    onCreate(data, session) {
      if (!data.username && session.user) {
        data.username = session.user.username
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
      'rarity',
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
      'butterflyId',
    ],
    allowedFilter: [
      'id',
      'userId',
      'galleryId',
      'artId',
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
      'butterflyId',
    ],
    views: {
      minimal: minimalSelect(['id', 'artId']),
      card: {
        select: publicArtImageSelect,
      },
      detail: {
        select: {
          ...publicArtImageSelect,
          imageData: true,
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
      'BotType',
      'name',
      'subtitle',
      'description',
      'avatarImage',
      'botIntro',
      'userIntro',
      'prompt',
      'trainingPath',
      'theme',
      'personality',
      'modules',
      'sampleResponse',
      'tagline',
      'isPublic',
      'isMature',
      'underConstruction',
      'canDelete',
      'userId',
      'designer',
      'serverId',
      'serverName',
      'artImageId',
    ],
    allowedFilter: [
      'id',
      'userId',
      'name',
      'designer',
      'serverId',
      'serverName',
      'isPublic',
      'isMature',
      'underConstruction',
    ],
    views: {
      minimal: minimalSelect(['id', 'name']),
      card: {
        select: {
          id: true,
          name: true,
          subtitle: true,
          description: true,
          avatarImage: true,
          artImageId: true,
          isPublic: true,
          isMature: true,
          userId: true,
          designer: true,
          createdAt: true,
        },
      },
      detail: {
        select: publicBotSelect,
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

  Butterfly: {
    delegate: prisma.butterfly,
    allowedWrite: [
      'name',
      'message',
      'wingTopColor',
      'wingBottomColor',
      'speed',
      'wingSpeed',
      'scale',
      'rarityNumber',
      'artImageId',
      'designer',
      'userId',
      'isPublic',
      'artId',
      'artCollectionId',
      'botId',
      'characterId',
      'pitchId',
      'promptId',
      'rewardId',
      'scenarioId',
      'tagId',
    ],
    allowedFilter: [
      'id',
      'name',
      'userId',
      'isPublic',
      'rarityNumber',
      'artImageId',
      'artId',
      'artCollectionId',
      'botId',
      'characterId',
      'pitchId',
      'promptId',
      'rewardId',
      'scenarioId',
      'tagId',
    ],
    views: {
      minimal: minimalSelect(['id', 'name']),
      card: {
        select: {
          id: true,
          name: true,
          message: true,
          wingTopColor: true,
          wingBottomColor: true,
          rarityNumber: true,
          artImageId: true,
          isPublic: true,
        },
      },
      detail: {
        select: publicButterflySelect,
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
      'title',
      'pitch',
      'designer',
      'flavorText',
      'highlightImage',
      'PitchType',
      'creationSource',
      'isMature',
      'isPublic',
      'userId',
      'imagePrompt',
      'description',
      'artImageId',
      'examples',
      'icon',
    ],
    allowedFilter: [
      'id',
      'userId',
      'PitchType',
      'isPublic',
      'isMature',
      'title',
      'designer',
      'artImageId',
    ],
    views: {
      minimal: minimalSelect(['id', 'title']),
      card: {
        select: {
          id: true,
          title: true,
          pitch: true,
          flavorText: true,
          highlightImage: true,
          PitchType: true,
          isPublic: true,
          isMature: true,
          artImageId: true,
          designer: true,
          userId: true,
          createdAt: true,
        },
      },
      detail: {
        select: publicPitchSelect,
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
      'isMature',
      'isPublic',
      'creationSource',
      'pitchId',
      'botId',
      'artImageId',
    ],
    allowedFilter: [
      'id',
      'userId',
      'botId',
      'pitchId',
      'galleryId',
      'isPublic',
      'isMature',
      'creationSource',
    ],
    views: {
      minimal: minimalSelect(['id']),
      card: {
        select: {
          id: true,
          createdAt: true,
          prompt: true,
          botId: true,
          pitchId: true,
          galleryId: true,
          isPublic: true,
          isMature: true,
        },
      },
      detail: {
        select: publicPromptSelect,
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
      'sender',
      'recipient',
      'content',
      'title',
      'isPublic',
      'isFavorite',
      'previousEntryId',
      'originId',
      'userId',
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
      'dreamId',
      'serverId',
      'serverName',
    ],
    allowedFilter: [
      'id',
      'userId',
      'botId',
      'characterId',
      'originId',
      'channel',
      'dreamId',
      'serverId',
      'isPublic',
      'isMature',
    ],
    views: {
      minimal: minimalSelect(['id', 'createdAt']),
      card: {
        select: {
          id: true,
          createdAt: true,
          type: true,
          sender: true,
          recipient: true,
          content: true,
          title: true,
          originId: true,
          botId: true,
          characterId: true,
          channel: true,
          dreamId: true,
          isPublic: true,
          isMature: true,
          userId: true,
        },
      },
      detail: {
        select: publicChatSelect,
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
      'isMature',
      'isPublic',
    ],
    allowedFilter: [
      'id',
      'userId',
      'title',
      'genres',
      'artImageId',
      'isPublic',
      'isMature',
    ],
    views: {
      minimal: minimalSelect(['id', 'title']),
      card: {
        select: {
          id: true,
          title: true,
          description: true,
          artImageId: true,
          imagePath: true,
          genres: true,
          isPublic: true,
          isMature: true,
          userId: true,
          createdAt: true,
        },
      },
      detail: {
        select: publicScenarioSelect,
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
      'isMature',
      'isPublic',
      'description',
      'category',
      'modelType',
    ],
    allowedFilter: [
      'id',
      'userId',
      'isPublic',
      'isMature',
      'type',
      'title',
      'category',
      'modelType',
    ],
    views: {
      minimal: minimalSelect(['id', 'title']),
      card: {
        select: {
          id: true,
          title: true,
          type: true,
          icon: true,
          label: true,
          link: true,
          component: true,
          category: true,
          modelType: true,
          isPublic: true,
          isMature: true,
        },
      },
      detail: {
        select: publicSmartIconSelect,
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
      minimal: minimalSelect(['id', 'name']),
      card: {
        select: {
          id: true,
          name: true,
          colorScheme: true,
          prefersDark: true,
          isPublic: true,
          tagline: true,
          room: true,
        },
      },
      detail: {
        select: publicThemeSelect,
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
      'isMature',
      'userId',
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
    allowedFilter: [
      'id',
      'userId',
      'isPublic',
      'isMature',
      'name',
      'genre',
      'designer',
      'artImageId',
    ],
    views: {
      minimal: minimalSelect(['id', 'name']),
      card: {
        select: {
          id: true,
          name: true,
          class: true,
          species: true,
          genre: true,
          honorific: true,
          artImageId: true,
          imagePath: true,
          isPublic: true,
          isMature: true,
          userId: true,
          createdAt: true,
        },
      },
      detail: {
        select: publicCharacterSelect,
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
      minimal: minimalSelect(['id', 'componentName']),
      card: {
        select: {
          id: true,
          componentName: true,
          folderName: true,
          isWorking: true,
          underConstruction: true,
          isBroken: true,
          title: true,
          artImageId: true,
          createdAt: true,
        },
      },
      detail: {
        select: publicComponentSelect,
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
      'reactionType',
      'reactionCategory',
      'rating',
      'artId',
      'artImageId',
      'artCollectionId',
      'botId',
      'butterflyId',
      'characterId',
      'chatId',
      'componentId',
      'dreamId',
      'galleryId',
      'pitchId',
      'promptId',
      'resourceId',
      'rewardId',
      'scenarioId',
      'tagId',
      'themeId',
    ],
    allowedFilter: [
      'id',
      'userId',
      'reactionType',
      'reactionCategory',
      'artId',
      'artImageId',
      'artCollectionId',
      'botId',
      'butterflyId',
      'characterId',
      'chatId',
      'componentId',
      'dreamId',
      'galleryId',
      'pitchId',
      'promptId',
      'resourceId',
      'rewardId',
      'scenarioId',
      'tagId',
      'themeId',
    ],
    views: {
      minimal: minimalSelect(['id', 'reactionType']),
      card: {
        select: {
          id: true,
          reactionType: true,
          reactionCategory: true,
          rating: true,
          comment: true,
          createdAt: true,
          userId: true,
        },
      },
      detail: {
        select: publicReactionSelect,
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
      'isPublic',
      'isMature',
      'resourceType',
      'supportedServer',
      'userId',
      'artImageId',
      'generation',
    ],
    allowedFilter: [
      'id',
      'userId',
      'resourceType',
      'supportedServer',
      'isPublic',
      'isMature',
      'name',
      'artImageId',
    ],
    views: {
      minimal: minimalSelect(['id', 'name']),
      card: {
        select: {
          id: true,
          name: true,
          customLabel: true,
          MediaPath: true,
          resourceType: true,
          supportedServer: true,
          isPublic: true,
          isMature: true,
          userId: true,
        },
      },
      detail: {
        select: publicResourceSelect,
      },
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
      'isPublic',
      'isMature',
    ],
    allowedFilter: [
      'id',
      'userId',
      'collection',
      'rarity',
      'label',
      'isPublic',
      'isMature',
      'artImageId',
    ],
    views: {
      minimal: minimalSelect(['id', 'label']),
      card: {
        select: {
          id: true,
          label: true,
          icon: true,
          rarity: true,
          collection: true,
          imagePath: true,
          isPublic: true,
          isMature: true,
          createdAt: true,
        },
      },
      detail: {
        select: publicRewardSelect,
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
    allowedFilter: ['id', 'userId', 'isPublic', 'isMature', 'label', 'title'],
    views: {
      minimal: minimalSelect(['id', 'label']),
      card: {
        select: {
          id: true,
          label: true,
          title: true,
          flavorText: true,
          isPublic: true,
          isMature: true,
          artImageId: true,
        },
      },
      detail: {
        select: publicTagSelect,
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
      minimal: minimalSelect(['id', 'name']),
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
        select: publicGallerySelect,
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
  const take = clamp(payload.take ?? payload.limit, 1, 100, 24)
  const skip = clamp(payload.skip ?? payload.offset, 0, 10_000, 0)
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

  const take = clamp(payload.take ?? payload.limit, 1, 100, 24)
  const skip = clamp(payload.skip ?? payload.offset, 0, 10_000, 0)
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
