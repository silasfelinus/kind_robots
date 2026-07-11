// /server/api/dreams/batch.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type {
  CreationSource,
  DreamType,
  Prisma,
} from '~/prisma/generated/prisma/client'
import {
  dreamInclude,
  normalizeCreationSource,
  normalizeDreamType,
  normalizeIdArray,
  normalizeNullableId,
  normalizeOptionalText,
  normalizeScenarioIds,
  normalizeSlug,
} from './index'

type StarterArtVariant = 'card' | 'icon' | 'hero'

type DreamMutationInput = {
  title?: string
  slug?: string | null
  dreamType?: DreamType
  creationSource?: CreationSource
  description?: string | null
  pitch?: string | null
  flavorText?: string | null
  examples?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  cardPath?: string | null
  heroPath?: string | null
  highlightImage?: string | null
  icon?: string | null
  designer?: string | null
  allowReviews?: boolean
  artImageId?: number | null
  artCollectionId?: number | null
  scenarioId?: number | null
  scenarioIds?: number[]
  Scenarios?: number[]
  characterIds?: number[]
  rewardIds?: number[]
  artImageIds?: number[]
  artCollectionIds?: number[]
  isPublic?: boolean
  isMature?: boolean
  isActive?: boolean
  createCollection?: boolean
  userId?: number
  seedStarterImages?: boolean
}

type DreamBatchBody =
  | DreamMutationInput[]
  | {
      dreams?: DreamMutationInput[]
    }

type DreamBatchError = {
  index: number
  title: string | null
  message: string
  statusCode: number
}

const starterArtVariants: StarterArtVariant[] = ['card', 'icon', 'hero']

function getDreamsFromBody(body: DreamBatchBody): DreamMutationInput[] {
  if (Array.isArray(body)) return body

  if (body && typeof body === 'object' && Array.isArray(body.dreams)) {
    return body.dreams
  }

  return []
}

function collectionImagePath(slug: string, variant: StarterArtVariant) {
  return `/images/artcollections/${slug}/${slug}-${variant}.webp`
}

function starterPromptForVariant(
  body: DreamMutationInput,
  title: string,
  variant: StarterArtVariant,
) {
  const basePrompt = normalizeOptionalText(body.artPrompt)
  const description = normalizeOptionalText(body.description)
  const pitch = normalizeOptionalText(body.pitch)
  const source = basePrompt || description || pitch || title

  if (variant === 'card') {
    return `Professional portrait card illustration for ${title}. Use this Dream seed as the visual brief: ${source}. Premium Kind Robots project-card key art, crisp focal subject, polished modern image generation quality, no readable text, no logo, no watermark, no collage, 2:3 portrait composition.`
  }

  if (variant === 'icon') {
    return `Premium square app icon for ${title}. Distill this Dream seed into one instantly readable symbol: ${source}. Strong silhouette, tactile dimensional polish, friendly Kind Robots visual language, no readable text, no logo, no watermark, no collage, square composition.`
  }

  return `High-end wide hero illustration for ${title}. Expand this Dream seed into a cinematic banner scene: ${source}. Studio-quality product and game key art, expressive staging, atmospheric depth, no readable text, no logo, no watermark, no collage, 16:9 landscape composition.`
}

function pathForDreamImage(
  body: DreamMutationInput,
  slug: string,
  variant: StarterArtVariant,
) {
  if (variant === 'card') {
    return normalizeOptionalText(body.cardPath) || collectionImagePath(slug, variant)
  }

  if (variant === 'hero') {
    return normalizeOptionalText(body.heroPath) || collectionImagePath(slug, variant)
  }

  return collectionImagePath(slug, variant)
}

async function createStarterArtImages({
  body,
  dreamId,
  artCollectionId,
  title,
  slug,
  userId,
  sender,
  isPublic,
  isMature,
}: {
  body: DreamMutationInput
  dreamId: number
  artCollectionId?: number | null
  title: string
  slug: string
  userId: number
  sender: string
  isPublic: boolean
  isMature: boolean
}) {
  if (!artCollectionId || body.seedStarterImages === false) return null

  let primaryCardArtImageId: number | null = null

  for (const variant of starterArtVariants) {
    const imagePath = pathForDreamImage(body, slug, variant)
    const prompt = starterPromptForVariant(body, title, variant)
    const image = await prisma.artImage.create({
      data: {
        fileName: `${slug}-${variant}.webp`,
        fileType: 'webp',
        imagePath,
        path: imagePath,
        promptString: prompt,
        artPrompt: prompt,
        designer: sender,
        isPublic,
        isMature,
        User: {
          connect: { id: userId },
        },
        Dreams: {
          connect: { id: dreamId },
        },
        ArtCollections: {
          connect: { id: artCollectionId },
        },
      },
      select: {
        id: true,
      },
    })

    if (variant === 'card') primaryCardArtImageId = image.id
  }

  return primaryCardArtImageId
}

async function createDreamFromInput(
  body: DreamMutationInput,
  callerUserId: number,
  sender: string,
  callerRole: string,
  callerIsAdmin: boolean,
) {
  const userId =
    callerIsAdmin && body.userId && Number.isInteger(body.userId) && body.userId > 0
      ? body.userId
      : callerUserId

  const title = body.title?.trim()

  if (!title) {
    throw createError({
      statusCode: 400,
      message: 'The "title" field is required.',
    })
  }

  const dreamTypeNormalized = normalizeDreamType(body.dreamType)

  const slug = body.slug?.trim()
    ? normalizeSlug(body.slug)
    : normalizeSlug(title)

  const isPublic = body.isPublic ?? true
  const isMature = body.isMature ?? false
  const isActive = body.isActive ?? true

  const artImageId = normalizeNullableId(body.artImageId)
  let artCollectionId = normalizeNullableId(body.artCollectionId)
  const shouldCreateCollection = body.createCollection !== false

  if (shouldCreateCollection && !artCollectionId) {
    // Give the collection the SAME slug as its folder
    // (public/images/artcollections/{slug}/) so it stays in parity with the
    // filesystem and folder-sync reuses it instead of creating a duplicate.
    // Previously slug was left null and later backfilled from the label
    // ("Sketchy Inspiration" -> "sketchy-inspiration"), which broke the
    // folder<->collection match. If a collection already claims this slug,
    // reuse it rather than colliding on the unique slug.
    const existingBySlug = slug
      ? await prisma.artCollection.findUnique({ where: { slug }, select: { id: true } })
      : null

    if (existingBySlug) {
      artCollectionId = existingBySlug.id
    } else {
      const collection = await prisma.artCollection.create({
        data: {
          ...(slug ? { slug } : {}),
          label: `${title} Inspiration`,
          description: `Card, icon, hero, screenshots, mockups, and inspiration art for ${title}. Drop additional files into public/images/artcollections/${slug}/ and attach matching ArtImage rows to keep this collection in parity with the filesystem.`,
          imagePath: collectionImagePath(slug, 'card'),
          artPrompt: normalizeOptionalText(body.artPrompt) ?? null,
          userId,
          username: sender,
          isPublic,
          isMature,
        },
      })

      artCollectionId = collection.id
    }
  }

  const scenarioIds = normalizeScenarioIds(body)
  const characterIds = normalizeIdArray(body.characterIds)
  const rewardIds = normalizeIdArray(body.rewardIds)
  const artImageIds = normalizeIdArray(body.artImageIds)
  const artCollectionIds = normalizeIdArray(body.artCollectionIds)
  const cardPath = normalizeOptionalText(body.cardPath) ?? collectionImagePath(slug, 'card')
  const heroPath = normalizeOptionalText(body.heroPath) ?? collectionImagePath(slug, 'hero')

  const dataInput: Prisma.DreamCreateInput = {
    title,
    slug,
    dreamType: dreamTypeNormalized,
    creationSource: normalizeCreationSource(body.creationSource),
    description: normalizeOptionalText(body.description) ?? null,
    pitch: normalizeOptionalText(body.pitch) ?? null,
    flavorText: normalizeOptionalText(body.flavorText) ?? null,
    examples: normalizeOptionalText(body.examples) ?? null,
    artPrompt: normalizeOptionalText(body.artPrompt) ?? null,
    imagePath: normalizeOptionalText(body.imagePath) ?? cardPath,
    cardPath,
    heroPath,
    highlightImage: normalizeOptionalText(body.highlightImage) ?? null,
    icon: normalizeOptionalText(body.icon) ?? 'kind-icon:dream',
    designer: normalizeOptionalText(body.designer) ?? sender,
    allowReviews: body.allowReviews ?? false,
    isPublic,
    isMature,
    isActive,
    User: {
      connect: { id: userId },
    },
    ...(artImageId
      ? {
          ArtImage: {
            connect: { id: artImageId },
          },
        }
      : {}),
    ...(artCollectionId
      ? {
          ArtCollection: {
            connect: { id: artCollectionId },
          },
        }
      : {}),
    ...(scenarioIds?.length
      ? {
          Scenarios: {
            connect: scenarioIds.map((id) => ({ id })),
          },
        }
      : {}),
    ...(characterIds?.length
      ? {
          Characters: {
            connect: characterIds.map((id) => ({ id })),
          },
        }
      : {}),
    ...(rewardIds?.length
      ? {
          Rewards: {
            connect: rewardIds.map((id) => ({ id })),
          },
        }
      : {}),
    ...(artImageIds?.length
      ? {
          ArtImages: {
            connect: artImageIds.map((id) => ({ id })),
          },
        }
      : {}),
    ...(artCollectionIds?.length
      ? {
          ArtCollections: {
            connect: artCollectionIds.map((id) => ({ id })),
          },
        }
      : {}),
  }

  const data = await prisma.dream.create({
    data: dataInput,
    include: dreamInclude,
  })

  const primaryCardArtImageId = await createStarterArtImages({
    body,
    dreamId: data.id,
    artCollectionId: data.artCollectionId,
    title,
    slug,
    userId,
    sender,
    isPublic,
    isMature,
  })

  if (!data.artImageId && primaryCardArtImageId) {
    await prisma.dream.update({
      where: { id: data.id },
      data: {
        ArtImage: {
          connect: { id: primaryCardArtImageId },
        },
      },
    })
  }

  if (data.artImageId && data.artCollectionId) {
    await prisma.artCollection.update({
      where: { id: data.artCollectionId },
      data: {
        ArtImages: {
          connect: { id: data.artImageId },
        },
      },
    })
  }

  await prisma.chat.create({
    data: {
      type: 'Dream',
      sender,
      content: `Dream started: ${title}`,
      title,
      userId,
      dreamId: data.id,
      artImageId: primaryCardArtImageId ?? data.artImageId ?? undefined,
      isPublic: data.isPublic,
      isMature: data.isMature,
      channel: `dream-${data.id}`,
    },
  })

  return prisma.dream.findUniqueOrThrow({
    where: { id: data.id },
    include: dreamInclude,
  })
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<DreamBatchBody>(event)
    const dreamsData = getDreamsFromBody(body)

    if (dreamsData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Dream batch cannot be empty.',
      })
    }

    for (const [index, dreamData] of dreamsData.entries()) {
      if (
        !dreamData ||
        typeof dreamData !== 'object' ||
        Array.isArray(dreamData)
      ) {
        throw createError({
          statusCode: 400,
          message: `Invalid dream at index ${index}. Expected an object.`,
        })
      }
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true },
    })

    const callerIsAdmin = user.Role === 'ADMIN' || user.id === 1
    const sender = userRecord?.username || `User ${user.id}`
    const dreams = []
    const errors: DreamBatchError[] = []

    for (const [index, dreamData] of dreamsData.entries()) {
      try {
        const dream = await createDreamFromInput(
          dreamData,
          user.id,
          sender,
          user.Role,
          callerIsAdmin,
        )

        dreams.push(dream)
      } catch (error: unknown) {
        const handled = errorHandler(error)

        errors.push({
          index,
          title: dreamData.title?.trim() || null,
          message: handled.message || 'Failed to create dream.',
          statusCode: handled.statusCode || 500,
        })
      }
    }

    if (errors.length > 0) {
      const statusCode = dreams.length > 0 ? 207 : 400

      event.node.res.statusCode = statusCode

      return {
        success: dreams.length > 0,
        message:
          dreams.length > 0
            ? 'Some dreams were created, but some failed.'
            : 'No dreams could be created.',
        errors,
        count: dreams.length,
        data: dreams,
        dreams,
        statusCode,
      }
    }

    event.node.res.statusCode = 201

    return {
      success: true,
      message: `${dreams.length} dream(s) created successfully.`,
      count: dreams.length,
      data: dreams,
      dreams,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to create dreams batch.',
      statusCode,
    }
  }
})