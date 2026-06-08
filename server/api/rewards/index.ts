// /server/api/rewards/index.ts
import { createError } from 'h3'
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
  compositionIds?: number[]
  setCharacterIds?: number[]
  setDreamIds?: number[]
  setCompositionIds?: number[]
  removeCharacterIds?: number[]
  removeDreamIds?: number[]
  removeCompositionIds?: number[]
}

export type RewardMutationInput = {
  id?: number
  name?: string
  label?: string
  slug?: string | null
  description?: string | null
  text?: string | null
  flavorText?: string | null
  effect?: string | null
  power?: string | null
  icon?: string | null
  collection?: string | null
  rarity?: Rarity | string
  rewardType?: RewardType | string
  type?: RewardType | string
  userId?: number | null
  artImageId?: number | null
  imagePath?: string | null
  artPrompt?: string | null
  isMature?: boolean
  isPublic?: boolean
  isActive?: boolean
} & RewardRelationInput

export type RewardBatchError = {
  index: number
  name?: string
  slug?: string | null
  message: string
}

export const rewardInclude = {
  ArtImage: true,
  Characters: true,
  Dreams: true,
  Compositions: true,
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

function toTrimmedString(
  value: unknown,
  maxLength?: number,
): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  return maxLength ? trimmed.slice(0, maxLength) : trimmed
}

function toNullableString(
  value: unknown,
  maxLength?: number,
): string | null | undefined {
  if (value === null) {
    return null
  }

  return toTrimmedString(value, maxLength)
}

function toBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function toPositiveInt(value: unknown): number | undefined {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function toNullablePositiveInt(value: unknown): number | null | undefined {
  if (value === null) {
    return null
  }

  return toPositiveInt(value)
}

function toPositiveIntArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(
    new Set(
      value
        .map((entry) => Number(entry))
        .filter((entry) => Number.isInteger(entry) && entry > 0),
    ),
  )
}

function connectMany(ids: number[]) {
  return ids.map((id) => ({ id }))
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 256)
}

export function normalizeRarity(value: unknown): Rarity | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.toUpperCase() as Rarity

  return validRarities.includes(normalized) ? normalized : undefined
}

export function normalizeRewardType(value: unknown): RewardType | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.toUpperCase() as RewardType

  return validRewardTypes.includes(normalized) ? normalized : undefined
}

export function buildCreateData(
  input: RewardMutationInput,
  authenticatedUserId: number,
): Prisma.RewardCreateInput {
  const name =
    toTrimmedString(input.name, 256) || toTrimmedString(input.label, 256)

  if (!name) {
    throw createError({
      statusCode: 400,
      message: 'Reward name is required.',
    })
  }

  const rewardType =
    normalizeRewardType(input.rewardType) ||
    normalizeRewardType(input.type) ||
    RewardType.ITEM

  const rarity = normalizeRarity(input.rarity) || Rarity.COMMON

  const slug =
    toNullableString(input.slug, 256) ?? slugify(`${rewardType}-${name}`)

  const description =
    toNullableString(input.description) ?? toNullableString(input.text) ?? null

  const effect =
    toNullableString(input.effect) ?? toNullableString(input.power) ?? null

  const flavorText = toNullableString(input.flavorText, 512)
  const icon = toNullableString(input.icon, 256)
  const collection = toNullableString(input.collection, 764)
  const imagePath = toNullableString(input.imagePath, 764)
  const artPrompt = toNullableString(input.artPrompt)
  const artImageId = toPositiveInt(input.artImageId)

  const characterIds = toPositiveIntArray(input.characterIds)
  const dreamIds = toPositiveIntArray(input.dreamIds)
  const compositionIds = toPositiveIntArray(input.compositionIds)

  return {
    name,
    slug,
    description,
    flavorText,
    effect,
    icon,
    collection,
    rarity,
    rewardType,
    imagePath,
    artPrompt,
    isMature: toBoolean(input.isMature) ?? false,
    isPublic: toBoolean(input.isPublic) ?? true,
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
    ...(compositionIds.length && {
      Compositions: {
        connect: connectMany(compositionIds),
      },
    }),
  }
}

export function buildUpdateData(
  input: RewardMutationInput,
): Prisma.RewardUpdateInput {
  const data: Prisma.RewardUpdateInput = {}

  const name =
    toTrimmedString(input.name, 256) || toTrimmedString(input.label, 256)
  const slug = toNullableString(input.slug, 256)
  const description =
    toNullableString(input.description) ?? toNullableString(input.text)
  const flavorText = toNullableString(input.flavorText, 512)
  const effect = toNullableString(input.effect) ?? toNullableString(input.power)
  const icon = toNullableString(input.icon, 256)
  const collection = toNullableString(input.collection, 764)
  const imagePath = toNullableString(input.imagePath, 764)
  const artPrompt = toNullableString(input.artPrompt)
  const rarity = normalizeRarity(input.rarity)
  const rewardType =
    normalizeRewardType(input.rewardType) || normalizeRewardType(input.type)
  const isMature = toBoolean(input.isMature)
  const isPublic = toBoolean(input.isPublic)
  const isActive = toBoolean(input.isActive)

  if (input.name !== undefined || input.label !== undefined) {
    if (!name) {
      throw createError({
        statusCode: 400,
        message: 'Reward name cannot be empty.',
      })
    }

    data.name = name
  }

  if (input.slug !== undefined) {
    data.slug = slug
  }

  if (input.description !== undefined || input.text !== undefined) {
    data.description = description ?? null
  }

  if (input.flavorText !== undefined) {
    data.flavorText = flavorText
  }

  if (input.effect !== undefined || input.power !== undefined) {
    data.effect = effect ?? null
  }

  if (input.icon !== undefined) {
    data.icon = icon
  }

  if (input.collection !== undefined) {
    data.collection = collection
  }

  if (input.imagePath !== undefined) {
    data.imagePath = imagePath
  }

  if (input.artPrompt !== undefined) {
    data.artPrompt = artPrompt
  }

  if (rarity) {
    data.rarity = rarity
  }

  if (rewardType) {
    data.rewardType = rewardType
  }

  if (isMature !== undefined) {
    data.isMature = isMature
  }

  if (isPublic !== undefined) {
    data.isPublic = isPublic
  }

  if (isActive !== undefined) {
    data.isActive = isActive
  }

  if (input.artImageId !== undefined) {
    const artImageId = toNullablePositiveInt(input.artImageId)

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
  const compositionIds = toPositiveIntArray(input.compositionIds)

  const setCharacterIds = toPositiveIntArray(input.setCharacterIds)
  const setDreamIds = toPositiveIntArray(input.setDreamIds)
  const setCompositionIds = toPositiveIntArray(input.setCompositionIds)

  const removeCharacterIds = toPositiveIntArray(input.removeCharacterIds)
  const removeDreamIds = toPositiveIntArray(input.removeDreamIds)
  const removeCompositionIds = toPositiveIntArray(input.removeCompositionIds)

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
    compositionIds.length ||
    setCompositionIds.length ||
    removeCompositionIds.length
  ) {
    data.Compositions = {
      ...(setCompositionIds.length && {
        set: connectMany(setCompositionIds),
      }),
      ...(compositionIds.length && {
        connect: connectMany(compositionIds),
      }),
      ...(removeCompositionIds.length && {
        disconnect: connectMany(removeCompositionIds),
      }),
    }
  }

  return data
}

export async function createReward(
  input: RewardMutationInput,
  authenticatedUserId: number,
): Promise<RewardWithRelations> {
  return await prisma.reward.create({
    data: buildCreateData(input, authenticatedUserId),
    include: rewardInclude,
  })
}

export async function createRewardsBatch(
  inputs: RewardMutationInput[],
  authenticatedUserId: number,
): Promise<{
  count: number
  rewards: RewardWithRelations[]
  errors: RewardBatchError[]
}> {
  const rewards: RewardWithRelations[] = []
  const errors: RewardBatchError[] = []

  for (const [index, input] of inputs.entries()) {
    try {
      const reward = await createReward(input, authenticatedUserId)

      rewards.push(reward)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown reward create error.'

      errors.push({
        index,
        name: input?.name || input?.label,
        slug: input?.slug,
        message,
      })
    }
  }

  return {
    count: rewards.length,
    rewards,
    errors,
  }
}

export async function fetchRewardById(
  id: number,
): Promise<RewardWithRelations | null> {
  return await prisma.reward.findUnique({
    where: { id },
    include: rewardInclude,
  })
}

export async function fetchRewardBySlug(
  slug: string,
): Promise<RewardWithRelations | null> {
  return await prisma.reward.findUnique({
    where: { slug },
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

export async function deleteRewardById(id: number): Promise<Reward> {
  return await prisma.reward.delete({
    where: { id },
  })
}

export { Rarity, RewardType }

export type { Reward }
