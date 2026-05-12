// /server/api/chatgpt/utils/actionGlossary.ts
import { fail } from './access'
import { isRecord } from './validate'
import { ACTION_NAMES, type KindRobotsActionName } from './contracts'

export type PublicChatGptAction = KindRobotsActionName

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
    return ['true', 'yes', '1', 'public', 'active'].includes(
      value.toLowerCase().trim(),
    )
  }

  if (typeof value === 'number') return value === 1

  return false
}

function toNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(numberValue) ? numberValue : undefined
}

function toString(value: unknown) {
  if (value === null || value === undefined) return undefined

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean)
      .join('\n')
  }

  const stringValue = String(value).trim()

  return stringValue || undefined
}

function toCommaText(value: unknown) {
  if (value === null || value === undefined) return undefined

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean)
      .join(', ')
  }

  const stringValue = String(value).trim()

  return stringValue || undefined
}

export const publicChatGptActions = ACTION_NAMES

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
      pitchId: 'pitchId',
      artId: 'artId',
      artImageId: 'artImageId',
      galleryId: 'galleryId',
      scenarioId: 'scenarioId',
      artCollectionId: 'artCollectionId',
      textServerId: 'textServerId',
      artServerId: 'artServerId',
      accessMode: 'accessMode',
      privacyCode: 'privacyCode',
    },
    transforms: {
      title: toString,
      slug: toString,
      description: toString,
      currentVibe: toString,
      currentPrompt: toString,
      isPublic: toBoolean,
      isMature: toBoolean,
      isActive: toBoolean,
      pitchId: toNumber,
      artId: toNumber,
      artImageId: toNumber,
      galleryId: toNumber,
      scenarioId: toNumber,
      artCollectionId: toNumber,
      textServerId: toNumber,
      artServerId: toNumber,
      accessMode: toString,
      privacyCode: toString,
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
      pitchId: 'pitchId',
      artId: 'artId',
      artImageId: 'artImageId',
      galleryId: 'galleryId',
      scenarioId: 'scenarioId',
      artCollectionId: 'artCollectionId',
      textServerId: 'textServerId',
      artServerId: 'artServerId',
      accessMode: 'accessMode',
      privacyCode: 'privacyCode',
    },
    transforms: {
      id: toNumber,
      title: toString,
      slug: toString,
      description: toString,
      currentVibe: toString,
      currentPrompt: toString,
      isPublic: toBoolean,
      isMature: toBoolean,
      isActive: toBoolean,
      pitchId: toNumber,
      artId: toNumber,
      artImageId: toNumber,
      galleryId: toNumber,
      scenarioId: toNumber,
      artCollectionId: toNumber,
      textServerId: toNumber,
      artServerId: toNumber,
      accessMode: toString,
      privacyCode: toString,
    },
  },

  'art.createPrompt': {
    model: 'Art',
    defaults: {
      isPublic: true,
      isMature: false,
      seed: -1,
      cfg: 3,
      cfgHalf: false,
    },
    aliases: {
      prompt: 'promptString',
      promptString: 'promptString',
      imagePrompt: 'promptString',
      artPrompt: 'promptString',
      negative: 'negativePrompt',
      negativePrompt: 'negativePrompt',
      checkpoint: 'checkpoint',
      modeler: 'checkpoint',
      checkpointResourceId: 'checkpointResourceId',
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
      genre: 'genres',
      serverId: 'serverId',
      serverName: 'serverName',
      serverUrl: 'serverUrl',
      artImageId: 'artImageId',
      public: 'isPublic',
      isPublic: 'isPublic',
      mature: 'isMature',
      isMature: 'isMature',
    },
    transforms: {
      promptString: toString,
      negativePrompt: toString,
      checkpoint: toString,
      checkpointResourceId: toNumber,
      sampler: toString,
      seed: toNumber,
      steps: toNumber,
      cfg: toNumber,
      cfgHalf: toBoolean,
      pitchId: toNumber,
      promptId: toNumber,
      galleryId: toNumber,
      path: toString,
      imagePath: toString,
      designer: toString,
      genres: toCommaText,
      serverId: toNumber,
      serverName: toString,
      serverUrl: toString,
      artImageId: toNumber,
      isPublic: toBoolean,
      isMature: toBoolean,
    },
  },

  'character.create': {
    model: 'Character',
    defaults: {
      isPublic: true,
      isMature: false,
    },
    aliases: {
      name: 'name',
      title: 'honorific',
      honorific: 'honorific',
      achievements: 'achievements',
      alignment: 'alignment',
      experience: 'experience',
      level: 'level',
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
      mature: 'isMature',
      isMature: 'isMature',
      statName1: 'statName1',
      statValue1: 'statValue1',
      statName2: 'statName2',
      statValue2: 'statValue2',
      statName3: 'statName3',
      statValue3: 'statValue3',
      statName4: 'statName4',
      statValue4: 'statValue4',
      statName5: 'statName5',
      statValue5: 'statValue5',
      statName6: 'statName6',
      statValue6: 'statValue6',
      goalStat1Name: 'goalStat1Name',
      goalStat1Value: 'goalStat1Value',
      goalStat2Name: 'goalStat2Name',
      goalStat2Value: 'goalStat2Value',
      goalStat3Name: 'goalStat3Name',
      goalStat3Value: 'goalStat3Value',
      goalStat4Name: 'goalStat4Name',
      goalStat4Value: 'goalStat4Value',
    },
    transforms: {
      name: toString,
      honorific: toString,
      achievements: toString,
      alignment: toString,
      experience: toNumber,
      level: toNumber,
      species: toString,
      class: toString,
      genre: toString,
      personality: toString,
      backstory: toString,
      drive: toString,
      inventory: toString,
      quirks: toString,
      skills: toString,
      artPrompt: toString,
      designer: toString,
      imagePath: toString,
      artImageId: toNumber,
      isPublic: toBoolean,
      isMature: toBoolean,
      statValue1: toNumber,
      statValue2: toNumber,
      statValue3: toNumber,
      statValue4: toNumber,
      statValue5: toNumber,
      statValue6: toNumber,
      goalStat1Value: toNumber,
      goalStat2Value: toNumber,
      goalStat3Value: toNumber,
      goalStat4Value: toNumber,
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
      genre: 'genres',
      inspirations: 'inspirations',
      imagePath: 'imagePath',
      artImageId: 'artImageId',
      public: 'isPublic',
      isPublic: 'isPublic',
      mature: 'isMature',
      isMature: 'isMature',
    },
    transforms: {
      title: toString,
      description: toString,
      intros: toString,
      locations: toString,
      artPrompt: toString,
      genres: toCommaText,
      inspirations: toString,
      imagePath: toString,
      artImageId: toNumber,
      isPublic: toBoolean,
      isMature: toBoolean,
    },
  },

  'bot.create': {
    model: 'Bot',
    defaults: {
      BotType: 'chat',
      isPublic: true,
      isMature: false,
      underConstruction: false,
      canDelete: false,
    },
    aliases: {
      BotType: 'BotType',
      type: 'BotType',
      name: 'name',
      title: 'name',
      subtitle: 'subtitle',
      description: 'description',
      avatar: 'avatarImage',
      avatarImage: 'avatarImage',
      personality: 'personality',
      prompt: 'prompt',
      systemPrompt: 'prompt',
      botIntro: 'botIntro',
      userIntro: 'userIntro',
      trainingPath: 'trainingPath',
      theme: 'theme',
      modules: 'modules',
      sampleResponse: 'sampleResponse',
      tagline: 'tagline',
      artImageId: 'artImageId',
      designer: 'designer',
      serverId: 'serverId',
      serverName: 'serverName',
      public: 'isPublic',
      isPublic: 'isPublic',
      mature: 'isMature',
      isMature: 'isMature',
      underConstruction: 'underConstruction',
      canDelete: 'canDelete',
    },
    transforms: {
      BotType: toString,
      name: toString,
      subtitle: toString,
      description: toString,
      avatarImage: toString,
      personality: toString,
      prompt: toString,
      botIntro: toString,
      userIntro: toString,
      trainingPath: toString,
      theme: toString,
      modules: toString,
      sampleResponse: toString,
      tagline: toString,
      artImageId: toNumber,
      designer: toString,
      serverId: toNumber,
      serverName: toString,
      isPublic: toBoolean,
      isMature: toBoolean,
      underConstruction: toBoolean,
      canDelete: toBoolean,
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
  const takeValue = input.take ?? input.limit
  const skipValue = input.skip ?? input.offset
  const take = typeof takeValue === 'number' ? takeValue : Number(takeValue)
  const skip = typeof skipValue === 'number' ? skipValue : Number(skipValue)
  const where = isRecord(input.where) ? input.where : {}

  return {
    where,
    take: Number.isFinite(take) ? Math.min(Math.max(take, 1), 100) : 24,
    skip: Number.isFinite(skip) ? Math.max(skip, 0) : 0,
  }
}
