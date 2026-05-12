// /server/api/chatgpt/utils/metaService.ts
import { fail } from './access'
import { isRecord } from './validate'

type ActionContract = {
  action: string
  purpose: string
  required: string[]
  recommended: string[]
  acceptedInput: Record<string, string>
  notes: string[]
  example: Record<string, unknown>
}

const actionContracts: Record<string, ActionContract> = {
  'dream.listPublic': {
    action: 'dream.listPublic',
    purpose: 'List public, active, non-mature Dream records.',
    required: [],
    recommended: ['take', 'view'],
    acceptedInput: {
      take: 'number, maximum number of records to return',
      skip: 'number, number of records to skip',
      view: 'minimal | card | detail',
      where:
        'optional object with allowed filters such as slug, title, artCollectionId, scenarioId',
    },
    notes: [
      'Use take, not limit.',
      'This action returns public active non-mature dreams.',
      'Default view is card.',
    ],
    example: {
      action: 'dream.listPublic',
      input: {
        take: 5,
        view: 'card',
      },
    },
  },

  'dream.getPublic': {
    action: 'dream.getPublic',
    purpose: 'Get one readable Dream by id.',
    required: ['id'],
    recommended: ['view'],
    acceptedInput: {
      id: 'number, Dream id',
      view: 'minimal | card | detail',
    },
    notes: [
      'Public dreams are readable.',
      'Owned private dreams may also be readable for authenticated users.',
    ],
    example: {
      action: 'dream.getPublic',
      input: {
        id: 44,
        view: 'detail',
      },
    },
  },

  'dream.createLocation': {
    action: 'dream.createLocation',
    purpose: 'Create one Dream location.',
    required: ['title', 'vibe'],
    recommended: [
      'slug',
      'description',
      'imagePrompt',
      'public',
      'mature',
      'active',
    ],
    acceptedInput: {
      title: 'string, Dream title',
      slug: 'string, URL-friendly unique slug',
      description: 'string, user-facing description',
      vibe: 'string, maps to currentVibe',
      imagePrompt: 'string, maps to currentPrompt',
      public: 'boolean, maps to isPublic',
      mature: 'boolean, maps to isMature',
      active: 'boolean, maps to isActive',
      artCollectionId: 'number, optional ArtCollection id',
      scenarioId: 'number, optional Scenario id',
    },
    notes: [
      'Use vibe instead of currentVibe.',
      'Use imagePrompt instead of currentPrompt.',
      'Created records belong to the authenticated Kind Robots user.',
    ],
    example: {
      action: 'dream.createLocation',
      input: {
        title: 'Lantern Dreamhouse',
        slug: 'lantern-dreamhouse',
        description: 'A cozy glowing home between waking and dreaming.',
        vibe: 'Warm, friendly, magical, and a little impossible.',
        imagePrompt:
          'bright saturated fantasy dreamhouse, glowing lanterns, cozy magical architecture',
        public: true,
        mature: false,
        active: true,
      },
    },
  },

  'asset.uploadImage': {
    action: 'asset.uploadImage',
    purpose:
      'Upload one generated image and create durable ArtImage and Art records.',
    required: ['label', 'imageData'],
    recommended: ['role', 'fileName', 'fileType', 'prompt', 'artCollectionId'],
    acceptedInput: {
      label:
        'string, unique asset label such as scenario.hero or dream.swamp.1',
      role: 'string, scenarioHero | characterPortrait | rewardIcon | dreamHero | dreamGallery',
      imageData: 'string, raw base64 or data URL',
      fileName: 'string, filename such as scenario-hero.webp',
      fileType: 'string, MIME type such as image/webp or image/png',
      prompt: 'string, prompt used to generate image',
      artCollectionId: 'number, optional collection id',
      galleryId: 'number, optional gallery id',
      public: 'boolean',
      mature: 'boolean',
    },
    notes: [
      'Generated final images require imageData.',
      'Do not use imageUrl unless explicitly asked.',
      'This returns artImageId and artId.',
    ],
    example: {
      action: 'asset.uploadImage',
      input: {
        label: 'scenario.hero',
        role: 'scenarioHero',
        imageData: 'data:image/webp;base64,...',
        fileName: 'scenario-hero.webp',
        fileType: 'image/webp',
        prompt: 'bright saturated fantasy dreamhouse hero image',
        public: true,
        mature: false,
      },
    },
  },

  'world.createContentBundle': {
    action: 'world.createContentBundle',
    purpose:
      'Create a multi-model content bundle with assets, collection, scenario, characters, rewards, and dreams.',
    required: ['title'],
    recommended: [
      'collection',
      'assets',
      'scenario',
      'characters',
      'rewards',
      'dreams',
    ],
    acceptedInput: {
      title: 'string, bundle title',
      collection: 'object with name, description, public, mature',
      assets:
        'array of uploaded/generated assets. Each generated asset requires label and imageData.',
      scenario: 'object with title, description, imageAsset, starterChoices',
      characters:
        'array of objects with name, species, class, personality, backstory, imageAsset',
      rewards: 'array of objects with label, text, power, rarity, imageAsset',
      dreams:
        'array of objects with title, slug, description, vibe, imageAssets',
    },
    notes: [
      'Every imageAsset must exactly match a label in assets.',
      'Every dream imageAssets entry must exactly match a label in assets.',
      'Generated images require imageData.',
      'Use four starter choices unless the user asks otherwise.',
      'Use five image assets per dream/location set unless the user asks otherwise.',
    ],
    example: {
      action: 'world.createContentBundle',
      input: {
        title: 'Lantern Dreamhouse Bundle',
        collection: {
          name: 'Lantern Dreamhouse',
          description:
            'Scenario, characters, rewards, locations, and generated assets.',
          public: true,
          mature: false,
        },
        assets: [],
        scenario: {
          title: 'The Door That Forgot You',
          description: 'A cozy surreal fantasy mystery.',
          imageAsset: 'scenario.hero',
          starterChoices: [
            'Open the blinking door',
            'Ask the moth for credentials',
            'Follow the lantern smoke',
            'Inspect the soft staircase',
          ],
        },
        characters: [],
        rewards: [],
        dreams: [],
      },
    },
  },
}

export function listActionContracts() {
  return {
    ok: true,
    data: Object.values(actionContracts).map((contract) => ({
      action: contract.action,
      purpose: contract.purpose,
      required: contract.required,
      recommended: contract.recommended,
    })),
  }
}

export function getActionContract(input: Record<string, unknown>) {
  if (!isRecord(input)) {
    fail('Input must be an object', 400)
  }

  const actionName = String(input.actionName || input.action || '').trim()

  if (!actionName) {
    fail('actionName is required', 400)
  }

  const contract = actionContracts[actionName]

  if (!contract) {
    fail(`Unknown action contract: ${actionName}`, 404)
  }

  return {
    ok: true,
    data: contract,
  }
}

export function getModelContract(input: Record<string, unknown>) {
  if (!isRecord(input)) {
    fail('Input must be an object', 400)
  }

  const model = String(input.model || '').trim()

  const contracts: Record<string, Record<string, unknown>> = {
    Dream: {
      model: 'Dream',
      publicActions: [
        'dream.listPublic',
        'dream.getPublic',
        'dream.createLocation',
        'dream.updateMine',
      ],
      friendlyFields: {
        title: 'title',
        slug: 'slug',
        description: 'description',
        vibe: 'currentVibe',
        imagePrompt: 'currentPrompt',
        public: 'isPublic',
        mature: 'isMature',
        active: 'isActive',
      },
      readableViews: ['minimal', 'card', 'detail'],
      notes: [
        'Use dream.createLocation instead of raw model writes.',
        'Use take, not limit, for list actions.',
      ],
    },
    Art: {
      model: 'Art',
      publicActions: [
        'art.listPublic',
        'art.getPublic',
        'art.createPrompt',
        'asset.uploadImage',
      ],
      friendlyFields: {
        prompt: 'promptString',
        negativePrompt: 'negativePrompt',
        imagePrompt: 'promptString',
        public: 'isPublic',
        mature: 'isMature',
      },
      notes: [
        'Use asset.uploadImage for generated images.',
        'asset.uploadImage returns artId and artImageId.',
      ],
    },
    Scenario: {
      model: 'Scenario',
      publicActions: [
        'scenario.create',
        'scenario.listPublic',
        'world.createContentBundle',
      ],
      friendlyFields: {
        title: 'title',
        description: 'description',
        intros: 'intros',
        artPrompt: 'artPrompt',
        imageAsset: 'resolved to artImageId by world.createContentBundle',
      },
      notes: [
        'For full scenarios with images and related models, use world.createContentBundle.',
      ],
    },
  }

  if (!model) {
    return {
      ok: true,
      data: Object.keys(contracts),
    }
  }

  const contract = contracts[model]

  if (!contract) {
    fail(`Unknown model contract: ${model}`, 404)
  }

  return {
    ok: true,
    data: contract,
  }
}
