// /server/api/chatgpt/utils/worldBundleService.ts
import prisma from '../../../utils/prisma'
import {
  type ChatGptActionHeaders,
  fail,
  requireUser,
  resolveChatGptSession,
} from './access'
import { runRegistryAction } from './actionRegistry'
import { uploadChatGptAsset, type UploadedChatGptAsset } from './assetService'
import { createArtCollectionFromAction } from './collectionService'
import { isRecord } from './validate'

type BundleAssetInput = {
  label?: unknown
  role?: unknown
  imageData?: unknown
  imageUrl?: unknown
  allowImageUrlOnly?: unknown
  fileName?: unknown
  fileType?: unknown
  prompt?: unknown
  imagePrompt?: unknown
  negativePrompt?: unknown
  galleryId?: unknown
  artCollectionId?: unknown
  createArt?: unknown
}

type BundleManifest = {
  title: string
  artCollection: {
    id: number | null
    name: string
  }
  assets: Record<string, UploadedChatGptAsset>
  scenario: any | null
  characters: any[]
  rewards: any[]
  dreams: any[]
  starterChoices: string[]
  links: {
    scenarioCharacterLinks: Array<{
      scenarioId: number
      characterId: number
      linked: boolean
    }>
    scenarioRewardLinks: Array<{
      scenarioId: number
      rewardId: number
      linked: boolean
    }>
    dreamAssets: Array<{
      dreamId: number
      assetLabel: string
      artId: number | null
      artImageId: number | null
    }>
  }
}

function asString(value: unknown, fallback = '') {
  if (typeof value === 'string') return value.trim()

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }

  return fallback
}

function asNumber(value: unknown, fallback = 0) {
  const numberValue = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(numberValue) ? numberValue : fallback
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return []
}

function asTextBlock(value: unknown, fallback = '') {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean)
      .join('\n')
  }

  return asString(value, fallback)
}

function asCommaText(value: unknown, fallback = '') {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean)
      .join(', ')
  }

  return asString(value, fallback)
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1

  if (typeof value === 'string') {
    return ['true', 'yes', '1', 'public'].includes(value.toLowerCase().trim())
  }

  return fallback
}

function firstAsset(
  assetMap: Record<string, UploadedChatGptAsset>,
  value: unknown,
) {
  const label = asString(value)

  if (!label) return null

  return assetMap[label] ?? null
}

function getAssetIds(
  assetMap: Record<string, UploadedChatGptAsset>,
  value: unknown,
) {
  const asset = firstAsset(assetMap, value)

  return {
    artId: asset?.artId ?? null,
    artImageId: asset?.artImageId ?? null,
    imagePath: asset?.imagePath ?? '',
  }
}

function cleanData(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  )
}

async function tryConnectRelation(opts: {
  delegateName: string
  recordId: number
  relationNames: string[]
  targetId: number
}) {
  const delegate = (prisma as any)[opts.delegateName]

  if (!delegate) return false

  for (const relationName of opts.relationNames) {
    try {
      await delegate.update({
        where: { id: opts.recordId },
        data: {
          [relationName]: {
            connect: {
              id: opts.targetId,
            },
          },
        },
      })

      return true
    } catch {}
  }

  return false
}

async function createModel(
  model: string,
  data: Record<string, unknown>,
  headers: ChatGptActionHeaders,
) {
  const result = await runRegistryAction(
    'kr.create',
    {
      model,
      data,
    },
    headers,
  )

  return (result as any).data
}

async function createAssets(
  assets: unknown,
  artCollectionId: number | null,
  headers: ChatGptActionHeaders,
) {
  const assetMap: Record<string, UploadedChatGptAsset> = {}

  if (!Array.isArray(assets)) {
    return assetMap
  }

  for (const asset of assets) {
    if (!isRecord(asset)) continue

    const label = asString(
      asset.label,
      `asset-${Object.keys(assetMap).length + 1}`,
    )
    const allowImageUrlOnly = asBoolean(asset.allowImageUrlOnly, false)
    const imageData = asString(asset.imageData)
    const imageUrl = asString(asset.imageUrl)

    if (!imageData && !allowImageUrlOnly) {
      fail(`Bundle asset "${label}" requires imageData`, 400)
    }

    if (!imageData && allowImageUrlOnly && !imageUrl) {
      fail(
        `Bundle asset "${label}" requires imageData, or imageUrl when allowImageUrlOnly is true`,
        400,
      )
    }

    const uploadResult = await uploadChatGptAsset(
      {
        ...(asset as BundleAssetInput),
        label,
        artCollectionId: artCollectionId ?? asset.artCollectionId,
        createArt: asset.createArt ?? true,
      },
      headers,
    )

    assetMap[label] = uploadResult.data
  }

  return assetMap
}

async function createScenario(opts: {
  input: Record<string, unknown>
  assetMap: Record<string, UploadedChatGptAsset>
  artCollectionId: number | null
  starterChoices: string[]
  headers: ChatGptActionHeaders
}) {
  if (!isRecord(opts.input)) return null

  const assetIds = getAssetIds(opts.assetMap, opts.input.imageAsset)
  const introEntries =
    asStringArray(opts.input.intros).length > 0
      ? asStringArray(opts.input.intros)
      : asStringArray(opts.input.intro).length > 0
        ? asStringArray(opts.input.intro)
        : opts.starterChoices

  const data = cleanData({
    title:
      asString(opts.input.title) ||
      asString(opts.input.name) ||
      'Untitled Scenario',
    description:
      asString(opts.input.description) || asString(opts.input.summary) || '',
    intros: introEntries.join('\n'),
    locations: asTextBlock(opts.input.locations),
    genres: asCommaText(opts.input.genres ?? opts.input.genre),
    inspirations: asTextBlock(opts.input.inspirations),
    artPrompt:
      asString(opts.input.artPrompt) ||
      asString(opts.input.imagePrompt) ||
      asString(opts.input.prompt),
    artImageId: assetIds.artImageId ?? undefined,
    imagePath: assetIds.imagePath || undefined,
    isPublic: asBoolean(opts.input.isPublic ?? opts.input.public, true),
    isMature: asBoolean(opts.input.isMature ?? opts.input.mature, false),
  })

  return createModel('Scenario', data, opts.headers)
}

async function createCharacters(opts: {
  characters: unknown
  scenarioId: number | null
  assetMap: Record<string, UploadedChatGptAsset>
  headers: ChatGptActionHeaders
}) {
  const created: any[] = []
  const links: Array<{
    scenarioId: number
    characterId: number
    linked: boolean
  }> = []

  if (!Array.isArray(opts.characters)) {
    return { created, links }
  }

  for (const character of opts.characters) {
    if (!isRecord(character)) continue

    const assetIds = getAssetIds(opts.assetMap, character.imageAsset)

    const data = cleanData({
      name: asString(character.name, 'Unnamed Character'),
      honorific: asString(character.honorific) || asString(character.title),
      species: asString(character.species),
      class: asString(character.class) || asString(character.role),
      genre: asString(character.genre),
      personality: asString(character.personality),
      backstory: asString(character.backstory),
      drive: asString(character.drive),
      inventory: asTextBlock(character.inventory),
      quirks: asTextBlock(character.quirks),
      skills: asTextBlock(character.skills),
      artPrompt:
        asString(character.artPrompt) ||
        asString(character.imagePrompt) ||
        asString(character.prompt),
      artImageId: assetIds.artImageId ?? undefined,
      imagePath: assetIds.imagePath || undefined,
      isPublic: asBoolean(character.isPublic ?? character.public, true),
      isMature: asBoolean(character.isMature ?? character.mature, false),
      designer: asString(character.designer),
    })

    const createdCharacter = await createModel('Character', data, opts.headers)
    created.push(createdCharacter)

    if (opts.scenarioId && createdCharacter?.id) {
      const linked = await tryConnectRelation({
        delegateName: 'scenario',
        recordId: opts.scenarioId,
        relationNames: ['Characters', 'characters'],
        targetId: createdCharacter.id,
      })

      links.push({
        scenarioId: opts.scenarioId,
        characterId: createdCharacter.id,
        linked,
      })
    }
  }

  return { created, links }
}

async function createRewards(opts: {
  rewards: unknown
  scenarioId: number | null
  assetMap: Record<string, UploadedChatGptAsset>
  headers: ChatGptActionHeaders
}) {
  const created: any[] = []
  const links: Array<{
    scenarioId: number
    rewardId: number
    linked: boolean
  }> = []

  if (!Array.isArray(opts.rewards)) {
    return { created, links }
  }

  for (const reward of opts.rewards) {
    if (!isRecord(reward)) continue

    const assetIds = getAssetIds(opts.assetMap, reward.imageAsset)

    const data = cleanData({
      label:
        asString(reward.label) || asString(reward.name) || 'Mystery Reward',
      text:
        asString(reward.text) ||
        asString(reward.description) ||
        asString(reward.summary),
      power: asString(reward.power, 'Mysterious power'),
      collection: asString(reward.collection, 'Bundle Rewards'),
      rarity: asNumber(reward.rarity, 0),
      icon: asString(reward.icon, 'kind-icon:gift'),
      imagePrompt:
        asString(reward.imagePrompt) ||
        asString(reward.artPrompt) ||
        asString(reward.prompt),
      artImageId: assetIds.artImageId ?? undefined,
      imagePath: assetIds.imagePath || undefined,
      isPublic: asBoolean(reward.isPublic ?? reward.public, true),
      isMature: asBoolean(reward.isMature ?? reward.mature, false),
    })

    const createdReward = await createModel('Reward', data, opts.headers)
    created.push(createdReward)

    if (opts.scenarioId && createdReward?.id) {
      const linked = await tryConnectRelation({
        delegateName: 'scenario',
        recordId: opts.scenarioId,
        relationNames: ['Rewards', 'rewards'],
        targetId: createdReward.id,
      })

      links.push({
        scenarioId: opts.scenarioId,
        rewardId: createdReward.id,
        linked,
      })
    }
  }

  return { created, links }
}

async function createDreams(opts: {
  dreams: unknown
  assetMap: Record<string, UploadedChatGptAsset>
  artCollectionId: number | null
  headers: ChatGptActionHeaders
}) {
  const created: any[] = []
  const dreamAssets: Array<{
    dreamId: number
    assetLabel: string
    artId: number | null
    artImageId: number | null
  }> = []

  if (!Array.isArray(opts.dreams)) {
    return { created, dreamAssets }
  }

  for (const dream of opts.dreams) {
    if (!isRecord(dream)) continue

    const imageAssetLabels = asStringArray(dream.imageAssets)
    const heroAsset = firstAsset(
      opts.assetMap,
      dream.imageAsset ?? imageAssetLabels[0],
    )
    const heroArtImageId = heroAsset?.artImageId ?? null
    const heroArtId = heroAsset?.artId ?? null

    const data = cleanData({
      title: asString(dream.title) || asString(dream.name) || 'Untitled Dream',
      slug: asString(dream.slug),
      description:
        asString(dream.description) ||
        asString(dream.summary) ||
        asString(dream.intro),
      currentVibe:
        asString(dream.currentVibe) ||
        asString(dream.vibe) ||
        asString(dream.mood) ||
        'Atmospheric, strange, and ready for adventure.',
      currentPrompt:
        asString(dream.currentPrompt) ||
        asString(dream.imagePrompt) ||
        asString(dream.artPrompt) ||
        asString(dream.prompt) ||
        heroAsset?.imagePath ||
        asString(dream.description),
      artId: heroArtId ?? undefined,
      artImageId: heroArtImageId ?? undefined,
      artCollectionId: opts.artCollectionId ?? undefined,
      isPublic: asBoolean(dream.isPublic ?? dream.public, true),
      isMature: asBoolean(dream.isMature ?? dream.mature, false),
      isActive: asBoolean(dream.isActive ?? dream.active, true),
    })

    const createdDream = await createModel('Dream', data, opts.headers)
    created.push({
      ...createdDream,
      heroArtId,
      heroArtImageId,
    })

    if (createdDream?.id) {
      for (const label of imageAssetLabels) {
        const asset = opts.assetMap[label]

        if (!asset) continue

        dreamAssets.push({
          dreamId: createdDream.id,
          assetLabel: label,
          artId: asset.artId,
          artImageId: asset.artImageId,
        })
      }
    }
  }

  return { created, dreamAssets }
}

export async function createWorldContentBundle(
  rawInput: Record<string, unknown>,
  headers: ChatGptActionHeaders,
): Promise<{ ok: true; data: BundleManifest }> {
  if (!isRecord(rawInput)) {
    fail('Input must be an object', 400)
  }

  const session = await resolveChatGptSession(headers)
  requireUser(session)

  const title =
    asString(rawInput.title) ||
    asString(rawInput.name) ||
    `ChatGPT Bundle ${Date.now()}`

  const collectionInput = isRecord(rawInput.collection)
    ? rawInput.collection
    : {
        name: `${title} Collection`,
        description: asString(rawInput.description),
        isPublic: rawInput.isPublic ?? rawInput.public ?? true,
        isMature: rawInput.isMature ?? rawInput.mature ?? false,
      }

  const collectionResult = await createArtCollectionFromAction(
    collectionInput,
    headers,
  )

  const artCollectionId = collectionResult.data.id
  const assetMap = await createAssets(rawInput.assets, artCollectionId, headers)
  const starterChoices = asStringArray(
    isRecord(rawInput.scenario)
      ? (rawInput.scenario.starterChoices ?? rawInput.starterChoices)
      : rawInput.starterChoices,
  )

  const scenario = await createScenario({
    input: isRecord(rawInput.scenario) ? rawInput.scenario : {},
    assetMap,
    artCollectionId,
    starterChoices,
    headers,
  })

  const scenarioId =
    scenario && typeof scenario.id === 'number' ? scenario.id : null

  const characters = await createCharacters({
    characters: rawInput.characters,
    scenarioId,
    assetMap,
    headers,
  })

  const rewards = await createRewards({
    rewards: rawInput.rewards,
    scenarioId,
    assetMap,
    headers,
  })

  const dreams = await createDreams({
    dreams: rawInput.dreams,
    assetMap,
    artCollectionId,
    headers,
  })

  return {
    ok: true,
    data: {
      title,
      artCollection: {
        id: artCollectionId,
        name: collectionResult.data.name,
      },
      assets: assetMap,
      scenario,
      characters: characters.created,
      rewards: rewards.created,
      dreams: dreams.created,
      starterChoices,
      links: {
        scenarioCharacterLinks: characters.links,
        scenarioRewardLinks: rewards.links,
        dreamAssets: dreams.dreamAssets,
      },
    },
  }
}
