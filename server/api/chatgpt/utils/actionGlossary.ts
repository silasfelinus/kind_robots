// /server/api/chatgpt/_utils/actionGlossary.ts
import { fail } from './access'
import { isRecord } from './validate'

export type PublicChatGptAction =
  | 'dream.createLocation'
  | 'dream.listPublic'
  | 'dream.getPublic'
  | 'dream.updateMine'
  | 'dream.deleteMine'
  | 'art.createPrompt'
  | 'art.listPublic'
  | 'art.getPublic'
  | 'character.create'
  | 'character.listPublic'
  | 'scenario.create'
  | 'scenario.listPublic'
  | 'gallery.listPublic'
  | 'bot.create'
  | 'bot.listPublic'
  | 'asset.uploadImage'
  | 'collection.createArtCollection'
  | 'world.createContentBundle'

export type GlossaryCreateAction =
  | 'dream.createLocation'
  | 'art.createPrompt'
  | 'character.create'
  | 'scenario.create'
  | 'bot.create'

export type GlossaryUpdateAction = 'dream.updateMine'

export type GlossaryAction = GlossaryCreateAction | GlossaryUpdateAction

type Transform = (value: unknown) => unknown

type GlossaryEntry = {
  model: string
  defaults?: Record<string, unknown>
  aliases: Record<string, string>
  transforms?: Record<string, Transform>
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return ['true', 'yes', '1', 'public'].includes(value.toLowerCase())
  }
  if (typeof value === 'number') return value === 1

  return false
}

function toNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(numberValue) ? numberValue : undefined
}

function toStringArray(value: unknown) {
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

export const actionGlossary: Partial<
  Record<PublicChatGptAction, GlossaryEntry>
> = {
  'dream.createLocation': {
    model: 'Dream',
    defaults: {
      isPublic: true,
      isMature: false,
      isActive: true,
    },
    aliases: {
      name: 'title',
      title: 'title',
      slug: 'slug',
      summary: 'description',
      description: 'description',
      intro: 'description',
      vibe: 'currentVibe',
      mood: 'currentVibe',
      atmosphere: 'currentVibe',
      prompt: 'currentPrompt',
      imagePrompt: 'currentPrompt',
      artPrompt: 'currentPrompt',
      public: 'isPublic',
      isPublic: 'isPublic',
      mature: 'isMature',
      isMature: 'isMature',
      active: 'isActive',
      isActive: 'isActive',
      scenarioId: 'scenarioId',
      artCollectionId: 'artCollectionId',
      textServerId: 'textServerId',
      artServerId: 'artServerId',
    },
    transforms: {
      isPublic: toBoolean,
      isMature: toBoolean,
      isActive: toBoolean,
      scenarioId: toNumber,
      artCollectionId: toNumber,
      textServerId: toNumber,
      artServerId: toNumber,
    },
  },

  'dream.updateMine': {
    model: 'Dream',
    aliases: {
      id: 'id',
      name: 'title',
      title: 'title',
      slug: 'slug',
      summary: 'description',
      description: 'description',
      vibe: 'currentVibe',
      mood: 'currentVibe',
      prompt: 'currentPrompt',
      imagePrompt: 'currentPrompt',
      public: 'isPublic',
      isPublic: 'isPublic',
      mature: 'isMature',
      isMature: 'isMature',
      active: 'isActive',
      isActive: 'isActive',
      scenarioId: 'scenarioId',
      artCollectionId: 'artCollectionId',
      textServerId: 'textServerId',
      artServerId: 'artServerId',
    },
    transforms: {
      id: toNumber,
      isPublic: toBoolean,
      isMature: toBoolean,
      isActive: toBoolean,
      scenarioId: toNumber,
      artCollectionId: toNumber,
      textServerId: toNumber,
      artServerId: toNumber,
    },
  },

  'art.createPrompt': {
    model: 'Art',
    defaults: {
      isPublic: true,
      isMature: false,
    },
    aliases: {
      prompt: 'promptString',
      imagePrompt: 'promptString',
      artPrompt: 'promptString',
      negative: 'negativePrompt',
      negativePrompt: 'negativePrompt',
      checkpoint: 'checkpoint',
      modeler: 'checkpoint',
      sampler: 'sampler',
      seed: 'seed',
      steps: 'steps',
      cfg: 'cfg',
      cfgHalf: 'cfgHalf',
      pitch: 'pitchId',
      pitchId: 'pitchId',
      promptId: 'promptId',
      gallery: 'galleryId',
      galleryId: 'galleryId',
      path: 'path',
      imagePath: 'imagePath',
      designer: 'designer',
      genres: 'genres',
      public: 'isPublic',
      isPublic: 'isPublic',
      mature: 'isMature',
      isMature: 'isMature',
    },
    transforms: {
      seed: toNumber,
      steps: toNumber,
      cfg: toNumber,
      cfgHalf: toBoolean,
      pitchId: toNumber,
      promptId: toNumber,
      galleryId: toNumber,
      isPublic: toBoolean,
      isMature: toBoolean,
      genres: toStringArray,
    },
  },

  'character.create': {
    model: 'Character',
    defaults: {
      isPublic: true,
    },
    aliases: {
      name: 'name',
      title: 'honorific',
      honorific: 'honorific',
      species: 'species',
      class: 'class',
      role: 'class',
      genre: 'genre',
      personality: 'personality',
      backstory: 'backstory',
      drive: 'drive',
      inventory: 'inventory',
      quirks: 'quirks',
      skills: 'skills',
      imagePrompt: 'artPrompt',
      artPrompt: 'artPrompt',
      prompt: 'artPrompt',
      designer: 'designer',
      imagePath: 'imagePath',
      artImageId: 'artImageId',
      public: 'isPublic',
      isPublic: 'isPublic',
    },
    transforms: {
      artImageId: toNumber,
      isPublic: toBoolean,
    },
  },

  'scenario.create': {
    model: 'Scenario',
    defaults: {
      isPublic: true,
      isMature: false,
    },
    aliases: {
      title: 'title',
      name: 'title',
      description: 'description',
      summary: 'description',
      intro: 'intros',
      intros: 'intros',
      locations: 'locations',
      artPrompt: 'artPrompt',
      imagePrompt: 'artPrompt',
      genres: 'genres',
      inspirations: 'inspirations',
      imagePath: 'imagePath',
      artImageId: 'artImageId',
      public: 'isPublic',
      isPublic: 'isPublic',
      mature: 'isMature',
      isMature: 'isMature',
    },
    transforms: {
      intros: toStringArray,
      locations: toStringArray,
      genres: toStringArray,
      inspirations: toStringArray,
      artImageId: toNumber,
      isPublic: toBoolean,
      isMature: toBoolean,
    },
  },

  'bot.create': {
    model: 'Bot',
    defaults: {
      isPublic: true,
      isMature: false,
    },
    aliases: {
      name: 'name',
      title: 'name',
      subtitle: 'subtitle',
      description: 'description',
      personality: 'personality',
      prompt: 'prompt',
      systemPrompt: 'prompt',
      avatar: 'avatar',
      avatarImage: 'avatarImage',
      imagePath: 'imagePath',
      artImageId: 'artImageId',
      designer: 'designer',
      public: 'isPublic',
      isPublic: 'isPublic',
      mature: 'isMature',
      isMature: 'isMature',
    },
    transforms: {
      artImageId: toNumber,
      isPublic: toBoolean,
      isMature: toBoolean,
    },
  },
}

function getGlossaryEntry(action: GlossaryAction): GlossaryEntry {
  const glossary = actionGlossary[action]

  if (!glossary) {
    fail(`No glossary entry for action: ${action}`, 400)
  }

  return glossary as GlossaryEntry
}
export function translateCreateInput(
  action: GlossaryCreateAction,
  input: Record<string, unknown>,
) {
  const glossary = getGlossaryEntry(action)

  const data: Record<string, unknown> = {
    ...(glossary.defaults ?? {}),
  }

  for (const [inputKey, value] of Object.entries(input)) {
    const targetKey = glossary.aliases[inputKey]

    if (!targetKey || targetKey === 'id') continue

    const transform = glossary.transforms?.[targetKey]
    const transformedValue = transform ? transform(value) : value

    if (transformedValue !== undefined) {
      data[targetKey] = transformedValue
    }
  }

  return {
    model: glossary.model,
    data,
  }
}

export function translateUpdateInput(
  action: GlossaryUpdateAction,
  input: Record<string, unknown>,
) {
  const glossary = getGlossaryEntry(action)
  const idValue = input.id
  const id = typeof idValue === 'number' ? idValue : Number(idValue)

  if (!Number.isFinite(id) || id <= 0) {
    fail('A valid id is required for updates', 400)
  }

  const data: Record<string, unknown> = {}

  for (const [inputKey, value] of Object.entries(input)) {
    const targetKey = glossary.aliases[inputKey]

    if (!targetKey || targetKey === 'id') continue

    const transform = glossary.transforms?.[targetKey]
    const transformedValue = transform ? transform(value) : value

    if (transformedValue !== undefined) {
      data[targetKey] = transformedValue
    }
  }

  return {
    model: glossary.model,
    id,
    data,
  }
}

export function getIdInput(input: Record<string, unknown>) {
  const value = input.id
  const id = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(id) || id <= 0) {
    fail('A valid id is required', 400)
  }

  return id
}

export function getListInput(input: Record<string, unknown>) {
  const takeValue = input.take
  const skipValue = input.skip
  const take = typeof takeValue === 'number' ? takeValue : Number(takeValue)
  const skip = typeof skipValue === 'number' ? skipValue : Number(skipValue)
  const where = isRecord(input.where) ? input.where : {}

  return {
    where,
    take: Number.isFinite(take) ? take : 24,
    skip: Number.isFinite(skip) ? skip : 0,
  }
}
