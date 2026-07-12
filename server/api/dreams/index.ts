// /server/api/dreams/index.ts
import { createError } from 'h3'
import type { H3Event } from 'h3'
import type {
  CreationSource,
  DreamType,
  Prisma,
} from '~/prisma/generated/prisma/client'

export type DreamAccessAction = 'view' | 'chat' | 'mutate'

type DreamAccessInput = {
  dream: {
    // null = orphaned (owner deleted): public dreams stay viewable, only admins mutate
    userId: number | null
    isPublic: boolean
  }
  userId?: number | null
  userRole?: string | null
  action?: DreamAccessAction
}

export const dreamTypes: DreamType[] = [
  'ART',
  'BRAINSTORM',
  'PROMPTBOT',
  'NARRATOR',
  'CHARACTER',
  'REWARD',
  'SCENARIO',
  'LOCATION',
  'PITCH',
  'WISH',
]

export const creationSources: CreationSource[] = [
  'HUMAN',
  'AI',
  'HYBRID',
  'UPLOAD',
  'UNKNOWN',
]

export const dreamCharacterSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  honorific: true,
  title: true,
  role: true,
  species: true,
  class: true,
  gender: true,
  presentation: true,
  alignment: true,
  genre: true,
  personality: true,
  drive: true,
  backstory: true,
  quirks: true,
  imagePath: true,
  artImageId: true,
  artPrompt: true,
  designer: true,
  charm: true,
  empathy: true,
  grace: true,
  luck: true,
  might: true,
  wits: true,
  isPublic: true,
  isMature: true,
  isActive: true,
  userId: true,
} satisfies Prisma.CharacterSelect

export const dreamRewardSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  slug: true,
  description: true,
  flavorText: true,
  effect: true,
  icon: true,
  collection: true,
  rarity: true,
  rewardType: true,
  userId: true,
  artImageId: true,
  imagePath: true,
  artPrompt: true,
  isPublic: true,
  isMature: true,
  isActive: true,
} satisfies Prisma.RewardSelect

export const dreamArtImageSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  fileName: true,
  fileType: true,
  path: true,
  imagePath: true,
  artPrompt: true,
  promptString: true,
  userId: true,
  isPublic: true,
  isMature: true,
} satisfies Prisma.ArtImageSelect

export const dreamArtCollectionSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  label: true,
  description: true,
  imagePath: true,
  isPublic: true,
  isMature: true,
  isActive: true,
  artPrompt: true,
  ArtImages: {
    take: 12,
    orderBy: {
      createdAt: 'desc',
    },
    select: dreamArtImageSelect,
  },
} satisfies Prisma.ArtCollectionSelect

export const dreamScenarioSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  title: true,
  description: true,
  intros: true,
  userId: true,
  artImageId: true,
  imagePath: true,
  locations: true,
  artPrompt: true,
  genres: true,
  inspirations: true,
  isMature: true,
  isPublic: true,
  isActive: true,
  difficulty: true,
  tier: true,
  group: true,
  secretNotes: true,
  cast: true,
  outputType: true,
  Characters: {
    select: dreamCharacterSelect,
    orderBy: {
      name: 'asc',
    },
  },
  _count: {
    select: {
      Characters: true,
      Dreams: true,
    },
  },
} satisfies Prisma.ScenarioSelect

export const dreamInclude = {
  User: {
    select: {
      id: true,
      username: true,
      avatarImage: true,
    },
  },
  ArtImage: {
    select: dreamArtImageSelect,
  },

  ArtImages: {
    take: 12,
    orderBy: {
      createdAt: 'desc',
    },
    select: dreamArtImageSelect,
  },
  ArtCollection: {
    select: dreamArtCollectionSelect,
  },
  ArtCollections: {
    take: 12,
    orderBy: {
      updatedAt: 'desc',
    },
    select: dreamArtCollectionSelect,
  },
  Scenarios: {
    select: dreamScenarioSelect,
    orderBy: {
      title: 'asc',
    },
  },
  Characters: {
    select: dreamCharacterSelect,
    orderBy: {
      updatedAt: 'desc',
    },
  },
  Rewards: {
    select: dreamRewardSelect,
    orderBy: {
      updatedAt: 'desc',
    },
  },
  _count: {
    select: {
      Chats: true,
      Reactions: true,
      Scenarios: true,
      Characters: true,
      Rewards: true,
      ArtImages: true,
      ArtCollections: true,
    },
  },
  Bots: {
    where: { BotType: 'NARRATOR', isActive: true },
    select: {
      id: true,
      BotType: true,
      name: true,
      subtitle: true,
      description: true,
      tagline: true,
      personality: true,
      avatarImage: true,
      imagePath: true,
      narrativeVoice: true,
      forgeIntro: true,
      botIntro: true,
      userIntro: true,
      prompt: true,
      serverId: true,
      serverName: true,
      ExpressionMedia: {
        where: { isActive: true },
        select: {
          id: true,
          expression: true,
          kind: true,
          label: true,
          emoticon: true,
          imagePath: true,
          message: true,
          additionalPhrases: true,
          isActive: true,
          designer: true,
          artPrompt: true,
          ArtImage: {
            select: dreamArtImageSelect,
          },
        },
        orderBy: {
          expression: 'asc',
        },
      },
    },
  },
} satisfies Prisma.DreamInclude

export function assertDreamAccess({
  dream,
  userId,
  userRole,
  action = 'view',
}: DreamAccessInput) {
  const isOwner = Boolean(userId && dream.userId === userId)
  const isAdmin = userRole === 'ADMIN'

  if (isOwner || isAdmin) return

  if (action === 'mutate' || action === 'chat') {
    throw createError({
      statusCode: 403,
      message:
        action === 'mutate'
          ? 'Only the Dream owner can reshape this Dream.'
          : 'You do not have permission to contribute to this Dream.',
    })
  }

  if (dream.isPublic) return

  throw createError({
    statusCode: 403,
    message: 'You do not have permission to view this Dream.',
  })
}

export function getDreamId(event: H3Event): number {
  const id = Number(event.context.params?.id)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid Dream ID. It must be a positive integer.',
    })
  }

  return id
}

export function normalizeNullableId(value: unknown): number | null | undefined {
  if (value === null) return null
  if (value === undefined || value === '') return undefined

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) return undefined

  return parsed
}

export function normalizeIdArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined

  const ids = value
    .map((entry) => {
      if (entry && typeof entry === 'object' && 'id' in entry) {
        return Number(entry.id)
      }

      return Number(entry)
    })
    .filter((id) => Number.isInteger(id) && id > 0)

  return Array.from(new Set(ids))
}

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function normalizeOptionalText(
  value: unknown,
): string | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()

  return trimmed || null
}

export function normalizeDreamType(value: unknown): DreamType {
  return dreamTypes.includes(value as DreamType)
    ? (value as DreamType)
    : 'PITCH'
}

export function parseDreamType(value: unknown): DreamType | null {
  return typeof value === 'string' && dreamTypes.includes(value as DreamType)
    ? (value as DreamType)
    : null
}

export function normalizeCreationSource(value: unknown): CreationSource {
  return creationSources.includes(value as CreationSource)
    ? (value as CreationSource)
    : 'HUMAN'
}

export function relationFromNullableId(
  value: unknown,
): { connect: { id: number } } | { disconnect: true } | undefined {
  const id = normalizeNullableId(value)

  if (id === null) return { disconnect: true }
  if (id) return { connect: { id } }

  return undefined
}

export function normalizeScenarioIds(body: {
  scenarioId?: unknown
  scenarioIds?: unknown
  Scenarios?: unknown
}): number[] | undefined {
  const scenarioIds = normalizeIdArray(body.scenarioIds)

  if (scenarioIds !== undefined) return scenarioIds

  const legacyScenarios = normalizeIdArray(body.Scenarios)

  if (legacyScenarios !== undefined) return legacyScenarios

  const scenarioId = normalizeNullableId(body.scenarioId)

  if (scenarioId) return [scenarioId]

  return undefined
}

export function scenariosRelationFromPatch(body: {
  scenarioId?: unknown
  scenarioIds?: unknown
  Scenarios?: unknown
}): Prisma.ScenarioUpdateManyWithoutDreamsNestedInput | undefined {
  const scenarioIds = normalizeScenarioIds(body)

  if (scenarioIds !== undefined) {
    return {
      set: scenarioIds.map((scenarioId) => ({ id: scenarioId })),
    }
  }

  if (body.scenarioId === undefined) return undefined

  const scenarioId = normalizeNullableId(body.scenarioId)

  if (scenarioId === null) {
    return {
      set: [],
    }
  }

  if (scenarioId) {
    return {
      set: [{ id: scenarioId }],
    }
  }

  return undefined
}
