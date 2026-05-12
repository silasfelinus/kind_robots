// /server/api/chatgpt/utils/contracts/actionContracts.ts
import { createError } from 'h3'
import { getModelContract } from './modelContracts'

export const ACTION_NAMES = [
  'dream.createLocation',
  'dream.listPublic',
  'dream.getPublic',
  'dream.getFull',
  'dream.updateMine',
  'dream.deleteMine',
  'art.createPrompt',
  'art.listPublic',
  'art.getPublic',
  'character.create',
  'character.listPublic',
  'scenario.create',
  'scenario.listPublic',
  'gallery.listPublic',
  'bot.create',
  'bot.listPublic',
  'asset.uploadImage',
  'asset.getImage',
  'asset.listRecentImages',
  'collection.createArtCollection',
  'world.createContentBundle',
  'meta.listActions',
  'meta.getActionContract',
  'meta.getModelContract',
] as const

export type KindRobotsActionName = (typeof ACTION_NAMES)[number]

export type ActionContract = {
  action: KindRobotsActionName
  summary: string
  input: Record<string, unknown>
  returns: Record<string, unknown>
  primaryModel?: string
  relatedModels?: string[]
  requiresAuth: boolean
  notes?: string[]
}

export const actionContracts: Record<KindRobotsActionName, ActionContract> = {
  'dream.createLocation': {
    action: 'dream.createLocation',
    summary: 'Create a public or private Dream location.',
    primaryModel: 'Dream',
    relatedModels: ['ArtCollection'],
    requiresAuth: true,
    input: {
      title: 'string required',
      slug: 'string optional',
      description: 'string optional',
      currentVibe: 'string required',
      currentPrompt: 'string optional',
      imagePrompt: 'string optional alias for currentPrompt',
      isPublic: 'boolean optional',
      isMature: 'boolean optional',
      isActive: 'boolean optional',
      createCollection: 'boolean optional',
    },
    returns: {
      dream: 'Public Dream',
      dreamId: 'number',
      artCollectionId: 'number optional',
    },
  },

  'dream.listPublic': {
    action: 'dream.listPublic',
    summary: 'List public active Dreams.',
    primaryModel: 'Dream',
    requiresAuth: true,
    input: {
      limit: 'number optional',
      offset: 'number optional',
      includeMature: 'boolean optional',
    },
    returns: {
      dreams: 'Public Dream[]',
    },
  },

  'dream.getPublic': {
    action: 'dream.getPublic',
    summary: 'Get one public Dream by id or slug.',
    primaryModel: 'Dream',
    requiresAuth: true,
    input: {
      id: 'number optional',
      slug: 'string optional',
      view: 'summary | detail optional',
    },
    returns: {
      dream: 'Public Dream',
    },
  },

  'dream.getFull': {
    action: 'dream.getFull',
    summary: 'Get one Dream with richer related context when access allows.',
    primaryModel: 'Dream',
    relatedModels: [
      'Art',
      'ArtImage',
      'ArtCollection',
      'Scenario',
      'Character',
      'Reward',
    ],
    requiresAuth: true,
    input: {
      id: 'number required',
      privacyCode: 'string optional',
    },
    returns: {
      dream: 'Public Dream',
      related: 'object optional',
    },
  },

  'dream.updateMine': {
    action: 'dream.updateMine',
    summary: 'Update a Dream owned by the authenticated user.',
    primaryModel: 'Dream',
    requiresAuth: true,
    input: {
      id: 'number required',
      title: 'string optional',
      slug: 'string optional',
      description: 'string optional',
      currentVibe: 'string optional',
      currentPrompt: 'string optional',
      isPublic: 'boolean optional',
      isMature: 'boolean optional',
      isActive: 'boolean optional',
      accessMode: 'OPEN | CODE | PRIVATE | SOLO optional',
      privacyCode: 'string optional',
    },
    returns: {
      dream: 'Public Dream',
      dreamId: 'number',
    },
  },

  'dream.deleteMine': {
    action: 'dream.deleteMine',
    summary: 'Delete a Dream owned by the authenticated user.',
    primaryModel: 'Dream',
    requiresAuth: true,
    input: {
      id: 'number required',
    },
    returns: {
      deleted: 'boolean',
      dreamId: 'number',
    },
  },

  'art.createPrompt': {
    action: 'art.createPrompt',
    summary: 'Create an Art prompt record.',
    primaryModel: 'Art',
    relatedModels: ['Prompt', 'Pitch', 'Gallery'],
    requiresAuth: true,
    input: {
      promptString: 'string required',
      negativePrompt: 'string optional',
      checkpoint: 'string optional',
      sampler: 'string optional',
      seed: 'number optional',
      steps: 'number optional',
      cfg: 'number optional',
      cfgHalf: 'boolean optional',
      pitchId: 'number optional',
      galleryId: 'number optional',
      artImageId: 'number optional',
      imagePath: 'string optional',
      genres: 'string optional',
      isPublic: 'boolean optional',
      isMature: 'boolean optional',
    },
    returns: {
      art: 'Public Art',
      artId: 'number',
    },
  },

  'art.listPublic': {
    action: 'art.listPublic',
    summary: 'List public Art records without imageData bloat.',
    primaryModel: 'Art',
    requiresAuth: true,
    input: {
      limit: 'number optional',
      offset: 'number optional',
      includeMature: 'boolean optional',
    },
    returns: {
      art: 'Public Art[]',
    },
  },

  'art.getPublic': {
    action: 'art.getPublic',
    summary: 'Get one public Art record by id.',
    primaryModel: 'Art',
    requiresAuth: true,
    input: {
      id: 'number required',
    },
    returns: {
      art: 'Public Art',
    },
  },

  'character.create': {
    action: 'character.create',
    summary: 'Create a Character.',
    primaryModel: 'Character',
    requiresAuth: true,
    input: {
      name: 'string required',
      honorific: 'string optional',
      species: 'string optional',
      class: 'string optional',
      genre: 'string optional',
      personality: 'string optional',
      backstory: 'string optional',
      drive: 'string optional',
      inventory: 'string optional',
      quirks: 'string optional',
      skills: 'string optional',
      artPrompt: 'string optional',
      imagePath: 'string optional',
      artImageId: 'number optional',
      isPublic: 'boolean optional',
      isMature: 'boolean optional',
    },
    returns: {
      character: 'Public Character',
      characterId: 'number',
    },
  },

  'character.listPublic': {
    action: 'character.listPublic',
    summary: 'List public Characters.',
    primaryModel: 'Character',
    requiresAuth: true,
    input: {
      limit: 'number optional',
      offset: 'number optional',
      includeMature: 'boolean optional',
    },
    returns: {
      characters: 'Public Character[]',
    },
  },

  'scenario.create': {
    action: 'scenario.create',
    summary: 'Create a Scenario.',
    primaryModel: 'Scenario',
    requiresAuth: true,
    input: {
      title: 'string required',
      description: 'string required',
      intros: 'string required',
      intro: 'string optional alias for intros',
      locations: 'string optional',
      artPrompt: 'string optional',
      genres: 'string optional',
      genre: 'string optional alias for genres',
      inspirations: 'string optional',
      imagePath: 'string optional',
      artImageId: 'number optional',
      isPublic: 'boolean optional',
      isMature: 'boolean optional',
    },
    returns: {
      scenario: 'Public Scenario',
      scenarioId: 'number',
    },
    notes: [
      'Prisma field is intros, not intro. Prisma field is genres, not genre.',
    ],
  },

  'scenario.listPublic': {
    action: 'scenario.listPublic',
    summary: 'List public Scenarios.',
    primaryModel: 'Scenario',
    requiresAuth: true,
    input: {
      limit: 'number optional',
      offset: 'number optional',
      includeMature: 'boolean optional',
    },
    returns: {
      scenarios: 'Public Scenario[]',
    },
  },

  'gallery.listPublic': {
    action: 'gallery.listPublic',
    summary: 'List public Galleries.',
    primaryModel: 'Gallery',
    requiresAuth: true,
    input: {
      limit: 'number optional',
      offset: 'number optional',
      includeMature: 'boolean optional',
    },
    returns: {
      galleries: 'Public Gallery[]',
    },
  },

  'bot.create': {
    action: 'bot.create',
    summary: 'Create a Bot.',
    primaryModel: 'Bot',
    requiresAuth: true,
    input: {
      BotType: 'string optional',
      name: 'string required',
      subtitle: 'string optional',
      description: 'string optional',
      avatarImage: 'string optional',
      botIntro: 'string required',
      userIntro: 'string required',
      prompt: 'string required',
      trainingPath: 'string optional',
      theme: 'string optional',
      personality: 'string optional',
      modules: 'string optional',
      sampleResponse: 'string optional',
      tagline: 'string optional',
      artImageId: 'number optional',
      isPublic: 'boolean optional',
      isMature: 'boolean optional',
    },
    returns: {
      bot: 'Public Bot',
      botId: 'number',
    },
    notes: ['Prisma field is avatarImage, not avatar.'],
  },

  'bot.listPublic': {
    action: 'bot.listPublic',
    summary: 'List public Bots.',
    primaryModel: 'Bot',
    requiresAuth: true,
    input: {
      limit: 'number optional',
      offset: 'number optional',
      includeMature: 'boolean optional',
    },
    returns: {
      bots: 'Public Bot[]',
    },
  },

  'asset.uploadImage': {
    action: 'asset.uploadImage',
    summary: 'Upload a generated image asset.',
    primaryModel: 'ArtImage',
    relatedModels: ['Art'],
    requiresAuth: true,
    input: {
      imageData: 'string required, raw base64 or data URL',
      fileName: 'string optional',
      fileType: 'string optional',
      label: 'string optional',
      role: 'string optional',
      prompt: 'string optional',
      galleryId: 'number optional',
      artId: 'number optional',
      botId: 'number optional',
      characterId: 'number optional',
      dreamId: 'number optional',
      scenarioId: 'number optional',
      rewardId: 'number optional',
      pitchId: 'number optional',
      promptId: 'number optional',
    },
    returns: {
      artImage: 'Public ArtImage',
      artImageId: 'number',
      artId: 'number optional',
    },
  },

  'asset.getImage': {
    action: 'asset.getImage',
    summary: 'Get one owned ArtImage by id, including imageData.',
    primaryModel: 'ArtImage',
    relatedModels: ['Art'],
    requiresAuth: true,
    input: {
      id: 'number required, alias artImageId',
      artImageId: 'number optional alias for id',
      asDataUrl:
        'boolean optional, include a dataUrl field for direct rendering',
    },
    returns: {
      artImage: 'Private ArtImage including imageData',
      artImageId: 'number',
      imageData: 'string raw base64',
      dataUrl: 'string optional data URL',
      hasImageData: 'boolean',
    },
    notes: [
      'Requires the authenticated user to own the ArtImage, unless the user is an admin.',
      'Use this after art.listPublic returns an artImageId.',
    ],
  },

  'asset.listRecentImages': {
    action: 'asset.listRecentImages',
    summary: 'List recent owned ArtImages, including imageData.',
    primaryModel: 'ArtImage',
    relatedModels: ['Art'],
    requiresAuth: true,
    input: {
      limit: 'number optional, default 5, max 25',
      offset: 'number optional',
      galleryId: 'number optional',
      artId: 'number optional',
      asDataUrl:
        'boolean optional, include dataUrl fields for direct rendering',
      includeAllUsers: 'boolean optional admin-only',
    },
    returns: {
      artImages: 'Private ArtImage[] including imageData',
      artImageIds: 'number[]',
    },
    notes: [
      'Defaults to the authenticated user’s own images.',
      'Admins may pass includeAllUsers=true to inspect all recent ArtImages.',
    ],
  },

  'collection.createArtCollection': {
    action: 'collection.createArtCollection',
    summary: 'Create an ArtCollection.',
    primaryModel: 'ArtCollection',
    requiresAuth: true,
    input: {
      label: 'string required',
      description: 'string optional',
      username: 'string optional',
      isPublic: 'boolean optional',
      isMature: 'boolean optional',
      artIds: 'number[] optional',
    },
    returns: {
      collection: 'Public ArtCollection',
      artCollectionId: 'number',
    },
  },

  'world.createContentBundle': {
    action: 'world.createContentBundle',
    summary: 'Create a multi-model content bundle.',
    primaryModel: 'Dream',
    relatedModels: [
      'Scenario',
      'Character',
      'Reward',
      'Art',
      'ArtImage',
      'ArtCollection',
    ],
    requiresAuth: true,
    input: {
      dream: 'object optional',
      scenario: 'object optional',
      characters: 'object[] optional',
      rewards: 'object[] optional',
      assets: 'object[] optional',
      collections: 'object[] optional',
      starterChoices: 'object[] optional',
    },
    returns: {
      dreamId: 'number optional',
      scenarioId: 'number optional',
      characterIds: 'number[] optional',
      rewardIds: 'number[] optional',
      artIds: 'number[] optional',
      artImageIds: 'number[] optional',
      artCollectionIds: 'number[] optional',
    },
  },

  'meta.listActions': {
    action: 'meta.listActions',
    summary: 'List available Kind Robots semantic actions.',
    requiresAuth: true,
    input: {},
    returns: {
      actions: 'ActionContract[]',
    },
  },

  'meta.getActionContract': {
    action: 'meta.getActionContract',
    summary: 'Get the input and return contract for one semantic action.',
    requiresAuth: true,
    input: {
      action: 'string required',
    },
    returns: {
      contract: 'ActionContract',
      modelContract: 'ModelContract optional',
    },
  },

  'meta.getModelContract': {
    action: 'meta.getModelContract',
    summary: 'Get public return fields and aliases for one model.',
    requiresAuth: true,
    input: {
      model: 'string required',
    },
    returns: {
      contract: 'ModelContract',
    },
  },
}

export function isKindRobotsActionName(
  action: string,
): action is KindRobotsActionName {
  return ACTION_NAMES.includes(action as KindRobotsActionName)
}

export function getActionContract(action: string) {
  if (!isKindRobotsActionName(action)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unknown action contract: ${action}`,
    })
  }

  const contract = actionContracts[action]

  return {
    ...contract,
    modelContract: contract.primaryModel
      ? getModelContract(contract.primaryModel)
      : null,
  }
}

export function listActionContracts() {
  return ACTION_NAMES.map((action) => actionContracts[action])
}
