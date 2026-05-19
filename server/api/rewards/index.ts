// /server/api/rewards/index.ts
import {
  Prisma,
  Rarity,
  RewardType,
  type Reward,
} from '~/prisma/generated/prisma/client'
import prisma from '../../utils/prisma'

export type RewardRelationInput = {
  characterIds?: number[]
  dreamIds?: number[]
  butterflyIds?: number[]
  setCharacterIds?: number[]
  setDreamIds?: number[]
  setButterflyIds?: number[]
  removeCharacterIds?: number[]
  removeDreamIds?: number[]
  removeButterflyIds?: number[]
}

export type RewardMutationInput = Partial<
  Pick<
    Reward,
    | 'id'
    | 'icon'
    | 'text'
    | 'power'
    | 'collection'
    | 'rarity'
    | 'label'
    | 'rewardType'
    | 'userId'
    | 'artImageId'
    | 'imagePath'
    | 'artPrompt'
    | 'isPublic'
    | 'isMature'
    | 'isActive'
  >
> &
  RewardRelationInput

export const rewardInclude = {
  ArtImage: true,
  Characters: true,
  Dreams: true,
  Reactions: true,
  User: {
    select: {
      id: true,
      username: true,
    },
  },
} satisfies Prisma.RewardInclude

export type RewardWithRelations = Prisma.RewardGetPayload<{
  include: typeof rewardInclude
}>

const validRarities = Object.values(Rarity)
const validRewardTypes = Object.values(RewardType)

function toTrimmedText(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined
}

function toNullableText(value: unknown): string | null | undefined {
  if (value === null) return null
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function toBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function toPositiveInt(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function toPositiveIntArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .map((entry) => Number(entry))
        .filter((entry) => Number.isInteger(entry) && entry > 0),
    ),
  )
}

function normalizeRarity(value: unknown): Rarity | undefined {
  if (typeof value !== 'string') return undefined

  const normalized = value.toUpperCase() as Rarity
  return validRarities.includes(normalized) ? normalized : undefined
}

function normalizeRewardType(value: unknown): RewardType | undefined {
  if (typeof value !== 'string') return undefined

  const normalized = value.toUpperCase() as RewardType
  return validRewardTypes.includes(normalized) ? normalized : undefined
}

function connectMany(ids: number[]) {
  return ids.length ? ids.map((id) => ({ id })) : undefined
}

function buildCreateData(
  input: RewardMutationInput,
  authenticatedUserId: number,
): Prisma.RewardCreateInput {
  const text = toTrimmedText(input.text)
  const power = toTrimmedText(input.power)

  if (!text) {
    throw new Error('Reward text is required.')
  }

  if (!power) {
    throw new Error('Reward power is required.')
  }

  const icon = toNullableText(input.icon)
  const collection = toNullableText(input.collection)
  const label = toNullableText(input.label)
  const imagePath = toNullableText(input.imagePath)
  const artPrompt = toNullableText(input.artPrompt)
  const rarity = normalizeRarity(input.rarity) ?? Rarity.COMMON
  const rewardType = normalizeRewardType(input.rewardType) ?? RewardType.ITEM
  const artImageId = toPositiveInt(input.artImageId)
  const characterIds = toPositiveIntArray(input.characterIds)
  const dreamIds = toPositiveIntArray(input.dreamIds)
  const butterflyIds = toPositiveIntArray(input.butterflyIds)

  return {
    text,
    power,
    icon,
    collection: collection ?? 'general',
    label,
    imagePath,
    artPrompt,
    rarity,
    rewardType,
    isPublic: toBoolean(input.isPublic) ?? true,
    isMature: toBoolean(input.isMature) ?? false,
    isActive: toBoolean(input.isActive) ?? true,
    User: {
      connect: {
        id: authenticatedUserId,
      },
    },
    ...(artImageId && {
      ArtImage: {
        connect: {
          id: artImageId,
        },
      },
    }),
    ...(characterIds.length && {
      Characters: {
        connect: connectMany(characterIds),
      },
    }),
    ...(dreamIds.length && {
      Dreams: {
        connect: connectMany(dreamIds),
      },
    }),
    ...(butterflyIds.length && {
      Butterflies: {
        connect: connectMany(butterflyIds),
      },
    }),
  }
}

function buildUpdateData(input: RewardMutationInput): Prisma.RewardUpdateInput {
  const data: Prisma.RewardUpdateInput = {}

  const icon = toNullableText(input.icon)
  const text = toTrimmedText(input.text)
  const power = toTrimmedText(input.power)
  const collection = toNullableText(input.collection)
  const label = toNullableText(input.label)
  const imagePath = toNullableText(input.imagePath)
  const artPrompt = toNullableText(input.artPrompt)
  const rarity = normalizeRarity(input.rarity)
  const rewardType = normalizeRewardType(input.rewardType)
  const isPublic = toBoolean(input.isPublic)
  const isMature = toBoolean(input.isMature)
  const isActive = toBoolean(input.isActive)

  if (input.icon !== undefined) data.icon = icon
  if (text !== undefined) data.text = text
  if (power !== undefined) data.power = power
  if (input.collection !== undefined) data.collection = collection ?? 'general'
  if (input.label !== undefined) data.label = label
  if (input.imagePath !== undefined) data.imagePath = imagePath
  if (input.artPrompt !== undefined) data.artPrompt = artPrompt
  if (rarity) data.rarity = rarity
  if (rewardType) data.rewardType = rewardType
  if (isPublic !== undefined) data.isPublic = isPublic
  if (isMature !== undefined) data.isMature = isMature
  if (isActive !== undefined) data.isActive = isActive

  if (input.artImageId !== undefined) {
    const artImageId = toPositiveInt(input.artImageId)

    data.ArtImage = artImageId
      ? {
          connect: {
            id: artImageId,
          },
        }
      : {
          disconnect: true,
        }
  }

  const characterIds = toPositiveIntArray(input.characterIds)
  const dreamIds = toPositiveIntArray(input.dreamIds)
  const butterflyIds = toPositiveIntArray(input.butterflyIds)
  const setCharacterIds = toPositiveIntArray(input.setCharacterIds)
  const setDreamIds = toPositiveIntArray(input.setDreamIds)
  const setButterflyIds = toPositiveIntArray(input.setButterflyIds)
  const removeCharacterIds = toPositiveIntArray(input.removeCharacterIds)
  const removeDreamIds = toPositiveIntArray(input.removeDreamIds)
  const removeButterflyIds = toPositiveIntArray(input.removeButterflyIds)

  if (
    characterIds.length ||
    setCharacterIds.length ||
    removeCharacterIds.length
  ) {
    data.Characters = {
      ...(setCharacterIds.length && {
        set: connectMany(setCharacterIds),
      }),
      ...(characterIds.length && {
        connect: connectMany(characterIds),
      }),
      ...(removeCharacterIds.length && {
        disconnect: connectMany(removeCharacterIds),
      }),
    }
  }

  if (dreamIds.length || setDreamIds.length || removeDreamIds.length) {
    data.Dreams = {
      ...(setDreamIds.length && {
        set: connectMany(setDreamIds),
      }),
      ...(dreamIds.length && {
        connect: connectMany(dreamIds),
      }),
      ...(removeDreamIds.length && {
        disconnect: connectMany(removeDreamIds),
      }),
    }
  }

  if (
    butterflyIds.length ||
    setButterflyIds.length ||
    removeButterflyIds.length
  ) {
    data.Butterflies = {
      ...(setButterflyIds.length && {
        set: connectMany(setButterflyIds),
      }),
      ...(butterflyIds.length && {
        connect: connectMany(butterflyIds),
      }),
      ...(removeButterflyIds.length && {
        disconnect: connectMany(removeButterflyIds),
      }),
    }
  }

  return data
}

export async function createReward(
  reward: RewardMutationInput,
  authenticatedUserId: number,
): Promise<RewardWithRelations> {
  return await prisma.reward.create({
    data: buildCreateData(reward, authenticatedUserId),
    include: rewardInclude,
  })
}

export async function fetchRewardById(
  id: number,
): Promise<RewardWithRelations | null> {
  return await prisma.reward.findUnique({
    where: { id },
    include: rewardInclude,
  })
}

export async function fetchAllRewards(): Promise<RewardWithRelations[]> {
  return await prisma.reward.findMany({
    where: {
      isActive: true,
    },
    include: rewardInclude,
    orderBy: [
      {
        updatedAt: 'desc',
      },
      {
        id: 'desc',
      },
    ],
  })
}

export async function updateRewardById(
  id: number,
  input: RewardMutationInput,
): Promise<RewardWithRelations> {
  return await prisma.reward.update({
    where: { id },
    data: buildUpdateData(input),
    include: rewardInclude,
  })
}

export async function createRewardsBatch(
  rewardsData: RewardMutationInput[],
  authenticatedUserId: number,
): Promise<{
  count: number
  rewards: RewardWithRelations[]
  errors: string[]
}> {
  const errors: string[] = []
  const rewards: RewardWithRelations[] = []

  for (const [index, rewardData] of rewardsData.entries()) {
    try {
      const reward = await prisma.reward.create({
        data: buildCreateData(rewardData, authenticatedUserId),
        include: rewardInclude,
      })

      rewards.push(reward)
    } catch (error) {
      errors.push(
        `Reward ${index + 1} failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    }
  }

  return {
    count: rewards.length,
    rewards,
    errors,
  }
}

export {
  Rarity,
  RewardType,
  buildCreateData,
  buildUpdateData,
  normalizeRarity,
  normalizeRewardType,
}

export type { Reward }
