// /stores/registerBuilderStore.ts
//
// Single owner for registering every builder project config into the
// builderStore registry. Each model builder (user, pitch, dream, character,
// reward, scenario, bot) closes over its own model store, so the configs MUST
// be constructed inside a Pinia-active scope — which a store provides.
//
// Call `ensureBuildersRegistered()` once from kind-loader (or anywhere Pinia is
// active) BEFORE the workspace tries to `setBuilder(stage)`. After that, the
// workspace is the sole driver of `setBuilder`; the old per-component
// *Builder.vue shims are no longer needed for registration.

import { defineStore } from 'pinia'
import { ref } from 'vue'

import type {
  BuilderCard,
  BuilderFieldValue,
  BuilderProjectConfig,
  BuilderSaveResult,
  BuilderSheet,
} from '@/stores/helpers/builderCards'

import { useBuilderStore } from '@/stores/builderStore'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { usePitchStore } from '@/stores/pitchStore'

import { BOT_CARDS } from '@/stores/helpers/botCards'
import { DREAM_CARDS } from '@/stores/helpers/dreamCards'
import { REWARD_CARDS } from '@/stores/helpers/rewardCards'
import { SCENARIO_CARDS } from '@/stores/helpers/scenarioCards'
import { PITCH_CARDS } from '@/stores/helpers/pitchCards'
import {
  ADVENTURE_CARDS,
  ADVENTURE_SPLASH,
  defaultAdventureSheet,
} from '@/stores/helpers/adventureCards'
import {
  ADVENTURE_CORE_CARD_KEYS,
  ADVENTURE_REQUIRED_CARD_KEYS,
  buildAdventureArtPrompt,
  syncAdventureStatTiers,
} from '@/stores/helpers/adventureHelper'

import type { Rarity, RewardType } from '~/prisma/generated/prisma/client'

// ───────────────────────────────────────────────────────────────────────────
// Shared sheet readers — small helpers used by every builder config below.
// They read from the live builderStore.sheet, so they're created per-build with
// the builder instance handed in.
// ───────────────────────────────────────────────────────────────────────────

type BuilderStoreInstance = ReturnType<typeof useBuilderStore>

function makeSheetReaders(builder: BuilderStoreInstance) {
  const text = (key: string): string => {
    const value = builder.sheet[key]
    return typeof value === 'string' ? value : ''
  }

  const num = (key: string): number | null => {
    const value = builder.sheet[key]
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }
    return null
  }

  const bool = (key: string, fallback = false): boolean => {
    const value = builder.sheet[key]
    return typeof value === 'boolean' ? value : fallback
  }

  return { text, num, bool }
}

// ───────────────────────────────────────────────────────────────────────────
// USER
// ───────────────────────────────────────────────────────────────────────────

const USER_CARDS: BuilderCard[] = [
  {
    key: 'account',
    label: 'Account',
    title: 'Sign in or create account',
    icon: 'kind-icon:login',
    tagline: 'Builder progress needs a real user.',
    narrative:
      'Log in or create an account so your work has somewhere reliable to live.',
    required: true,
    restoresFields: [],
    unlockCondition: 'always',
    steps: [
      {
        key: 'account',
        title: 'Account',
        narrative:
          'Use the account tools to log in or create a profile before building.',
        inputType: 'custom',
      },
    ],
  },
  {
    key: 'designer',
    label: 'Designer',
    title: 'Your creative identity',
    icon: 'kind-icon:signature',
    tagline: 'Username for access. Designer name for the work.',
    narrative: 'Choose the public creative byline attached to your creations.',
    required: false,
    restoresFields: ['designerName'],
    unlockCondition: 'always',
    steps: [
      {
        key: 'designerName',
        title: 'Designer Name',
        narrative: 'Set the creative name that appears on your work.',
        inputType: 'text',
        field: 'designerName',
        placeholder: 'The Velvet Goblin Atelier',
        inputLabel: 'Designer Name',
      },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    title: 'Privacy and maturity',
    icon: 'kind-icon:sliders',
    tagline: 'Defaults for new creations.',
    narrative:
      'Choose visibility and content preferences for future creations.',
    required: false,
    restoresFields: ['isPublic', 'showMature'],
    unlockCondition: 'always',
    steps: [
      {
        key: 'visibility',
        title: 'Default Visibility',
        narrative: 'Choose whether new creations start public or private.',
        inputType: 'visibility',
        field: 'isPublic',
      },
      {
        key: 'showMature',
        title: 'Mature Content',
        narrative: 'Choose whether mature content is visible while building.',
        inputType: 'toggle',
        field: 'showMature',
      },
    ],
  },
]

function buildUserConfig(): BuilderProjectConfig {
  const builder = useBuilderStore()
  const userStore = useUserStore()
  const { text, bool } = makeSheetReaders(builder)

  const startCard = 'account'

  function defaultUserSheet(): BuilderSheet {
    return {
      username: userStore.username ?? '',
      designerName: userStore.user?.designerName ?? userStore.username ?? '',
      avatarImage: userStore.user?.avatarImage ?? null,
      isPublic: true,
      showMature: userStore.user?.showMature ?? false,
      userId: userStore.userId ?? userStore.user?.id ?? 10,
    }
  }

  async function save(): Promise<BuilderSaveResult> {
    builder.clearError()
    try {
      await userStore.updateUser({
        designerName: text('designerName'),
        showMature: bool('showMature', false),
      })
      builder.setStatus('User settings saved.')
      return {
        success: true,
        message: 'User settings saved.',
        data: userStore.user,
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save user settings.'
      builder.setLastError(error, message)
      return { success: false, message, data: null }
    }
  }

  function reset() {
    builder.resetBuilder(true)
    builder.selectCard(startCard)
  }

  return {
    key: 'user',
    label: 'User Builder',
    title: 'User Builder',
    modelType: 'user',
    storageKey: 'kindrobots.builder.user.v1',
    cards: USER_CARDS,
    splash: {
      title: 'User Builder',
      subtitle: 'Set up your account, designer identity, and defaults.',
      tagline: 'A tiny foyer before the larger nonsense.',
      description:
        'Configure the account details and preferences that shape the rest of the workshop.',
      imagePath: '/images/users/splash.webp',
      ctaLabel: 'Start Profile',
      secondaryLabel: 'Review Settings',
    },
    defaultSheet: defaultUserSheet,
    coreCardKeys: ['account'],
    requiredCardKeys: ['account'],
    finalCardKey: 'settings',
    clearFieldDefaults: {
      avatarImage: null,
      isPublic: true,
      showMature: false,
      userId: 10,
    },
    persistActiveCard: true,
    allowCompletedCardsInDeck: true,
    suggestContext: {
      builder: 'user',
      tone: 'Friendly, concise, and onboarding-focused.',
    },
    startCardKey: startCard,
    save,
    reset,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// BOT
// ───────────────────────────────────────────────────────────────────────────

function buildBotConfig(): BuilderProjectConfig {
  const builder = useBuilderStore()
  const botStore = useBotStore()
  const userStore = useUserStore()
  const { text, num, bool } = makeSheetReaders(builder)

  const startCard = 'type'

  function defaultBotSheet(): BuilderSheet {
    const form = botStore.botForm as Record<string, unknown>
    return {
      BotType: typeof form.BotType === 'string' ? form.BotType : 'assistant',
      name: typeof form.name === 'string' ? form.name : '',
      subtitle: typeof form.subtitle === 'string' ? form.subtitle : '',
      description: typeof form.description === 'string' ? form.description : '',
      avatarImage: typeof form.avatarImage === 'string' ? form.avatarImage : '',
      botIntro: typeof form.botIntro === 'string' ? form.botIntro : '',
      userIntro: typeof form.userIntro === 'string' ? form.userIntro : '',
      prompt: typeof form.prompt === 'string' ? form.prompt : '',
      trainingPath:
        typeof form.trainingPath === 'string' ? form.trainingPath : '',
      theme: typeof form.theme === 'string' ? form.theme : '',
      personality: typeof form.personality === 'string' ? form.personality : '',
      modules: typeof form.modules === 'string' ? form.modules : '',
      sampleResponse:
        typeof form.sampleResponse === 'string' ? form.sampleResponse : '',
      tagline: typeof form.tagline === 'string' ? form.tagline : '',
      artPrompt: typeof form.artPrompt === 'string' ? form.artPrompt : '',
      artImageId: typeof form.artImageId === 'number' ? form.artImageId : null,
      userId:
        typeof form.userId === 'number'
          ? form.userId
          : (userStore.userId ?? userStore.user?.id ?? 10),
      isPublic: typeof form.isPublic === 'boolean' ? form.isPublic : true,
      underConstruction:
        typeof form.underConstruction === 'boolean'
          ? form.underConstruction
          : false,
      canDelete: typeof form.canDelete === 'boolean' ? form.canDelete : true,
    }
  }

  function syncSheetToBotForm() {
    const resolvedUserId =
      num('userId') ?? userStore.userId ?? userStore.user?.id ?? 10
    botStore.setBotForm({
      BotType: text('BotType'),
      name: text('name'),
      subtitle: text('subtitle'),
      description: text('description'),
      avatarImage: text('avatarImage'),
      botIntro: text('botIntro'),
      userIntro: text('userIntro'),
      prompt: text('prompt'),
      trainingPath: text('trainingPath'),
      theme: text('theme'),
      personality: text('personality'),
      modules: text('modules'),
      sampleResponse: text('sampleResponse'),
      tagline: text('tagline'),
      artPrompt: text('artPrompt'),
      artImageId: num('artImageId') ?? undefined,
      userId: resolvedUserId,
      isPublic: bool('isPublic', true),
      underConstruction: bool('underConstruction', false),
      canDelete: bool('canDelete', true),
    })
  }

  async function save(): Promise<BuilderSaveResult> {
    builder.clearError()
    syncSheetToBotForm()
    const result = await botStore.saveBot()
    if (result.success && result.data) {
      builder.setStatus('Bot saved.')
      return { success: true, message: 'Bot saved.', data: result.data }
    }
    const message =
      result.message || botStore.lastError || 'Failed to save bot.'
    builder.setLastError(new Error(message), message)
    return { success: false, message, data: result.data ?? null }
  }

  function reset() {
    botStore.startAddingBot()
    builder.resetBuilder(true)
    builder.selectCard(startCard)
  }

  return {
    key: 'bot',
    label: 'Bot Builder',
    title: 'Bot Builder',
    modelType: 'bot',
    storageKey: 'kindrobots.builder.bot.v1',
    cards: BOT_CARDS,
    splash: {
      title: 'Bot Builder',
      subtitle: 'Design a conversational robot with a job, voice, and vibe.',
      tagline: 'Give it a brain. Give it boundaries. Try not to create Clippy.',
      description:
        'Build a bot one card at a time: type, identity, prompt, personality, intros, presentation, visibility, and art.',
      imagePath: '/images/bots/splash.webp',
      ctaLabel: 'Start Bot',
      secondaryLabel: 'Surprise Me',
    },
    defaultSheet: defaultBotSheet,
    coreCardKeys: ['type', 'identity', 'prompt'],
    requiredCardKeys: ['type', 'identity', 'prompt'],
    finalCardKey: 'art',
    artPurpose: 'builder',
    artImageRole: 'avatar',
    artTitle: 'Bot Avatar Designer',
    artDescription:
      'Create, upload, select, or generate avatar art for this bot.',
    clearFieldDefaults: {
      avatarImage: '',
      artImageId: null,
      userId: 10,
      isPublic: true,
      underConstruction: false,
      canDelete: true,
    },
    persistActiveCard: true,
    allowCompletedCardsInDeck: false,
    suggestContext: {
      builder: 'bot',
      tone: 'Useful, specific, lively, and safe.',
    },
    startCardKey: startCard,
    save,
    reset,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// DREAM
// ───────────────────────────────────────────────────────────────────────────

function buildDreamConfig(): BuilderProjectConfig {
  const builder = useBuilderStore()
  const dreamStore = useDreamStore()
  const userStore = useUserStore()
  const { text, num, bool } = makeSheetReaders(builder)

  const startCard = 'atmosphere'

  type DreamAccessMode = 'OPEN' | 'PRIVATE' | 'CODE'
  function getAccessMode(): DreamAccessMode {
    const value = text('accessMode')
    if (value === 'PRIVATE' || value === 'CODE') return value
    return 'OPEN'
  }

  function defaultDreamSheet(): BuilderSheet {
    const form = dreamStore.dreamForm as Record<string, unknown>
    return {
      vibeTag: '',
      title: typeof form.title === 'string' ? form.title : '',
      description: typeof form.description === 'string' ? form.description : '',
      currentVibe: typeof form.currentVibe === 'string' ? form.currentVibe : '',
      currentPrompt:
        typeof form.currentPrompt === 'string' ? form.currentPrompt : '',
      accessMode:
        form.accessMode === 'PRIVATE' || form.accessMode === 'CODE'
          ? form.accessMode
          : 'OPEN',
      privacyCode: typeof form.privacyCode === 'string' ? form.privacyCode : '',
      artPrompt: typeof form.artPrompt === 'string' ? form.artPrompt : '',
      artImageId: typeof form.artImageId === 'number' ? form.artImageId : null,
      userId:
        typeof form.userId === 'number'
          ? form.userId
          : (userStore.userId ?? userStore.user?.id ?? 10),
      isPublic: typeof form.isPublic === 'boolean' ? form.isPublic : true,
      isMature: typeof form.isMature === 'boolean' ? form.isMature : false,
    }
  }

  function syncSheetToDreamForm() {
    const mode = getAccessMode()
    const resolvedUserId =
      num('userId') ?? userStore.userId ?? userStore.user?.id ?? 10
    dreamStore.setDreamForm({
      title: text('title'),
      description: text('description'),
      currentVibe: text('currentVibe'),
      currentPrompt: text('currentPrompt'),
      accessMode: mode,
      privacyCode: mode === 'CODE' ? text('privacyCode') : '',
      artPrompt: text('artPrompt'),
      artImageId: num('artImageId') ?? undefined,
      userId: resolvedUserId,
      isPublic: bool('isPublic', true),
      isMature: bool('isMature', false),
    })
  }

  async function save(): Promise<BuilderSaveResult> {
    builder.clearError()
    syncSheetToDreamForm()
    const result = await dreamStore.saveDream()
    if (result.success && result.data) {
      builder.setStatus('Dream saved.')
      return { success: true, message: 'Dream saved.', data: result.data }
    }
    const message =
      result.message || dreamStore.error || 'Failed to save dream.'
    builder.setLastError(new Error(message), message)
    return { success: false, message, data: result.data ?? null }
  }

  function reset() {
    dreamStore.startAddingDream()
    builder.resetBuilder(true)
    builder.selectCard(startCard)
  }

  return {
    key: 'dream',
    label: 'Dream Builder',
    title: 'Dream Builder',
    modelType: 'dream',
    storageKey: 'kindrobots.builder.dream.v1',
    cards: DREAM_CARDS,
    splash: {
      title: 'Dream Builder',
      subtitle: 'Create a place, mood, or impossible location.',
      tagline: 'Give the story somewhere weird to stand.',
      description:
        'Build a dream space one card at a time: atmosphere, title, description, current vibe, active prompt, access settings, and art.',
      imagePath: '/images/dreams/splash.webp',
      ctaLabel: 'Start Dream',
      secondaryLabel: 'Surprise Me',
    },
    defaultSheet: defaultDreamSheet,
    coreCardKeys: ['atmosphere', 'title', 'description'],
    requiredCardKeys: ['atmosphere', 'title', 'description'],
    finalCardKey: 'art',
    artPurpose: 'dream',
    artImageRole: 'world',
    artTitle: 'Dream Image Designer',
    artDescription:
      'Create, upload, select, or generate art for this dream space.',
    clearFieldDefaults: {
      vibeTag: '',
      artImageId: null,
      accessMode: 'OPEN',
      privacyCode: '',
      userId: 10,
      isPublic: true,
      isMature: false,
    },
    persistActiveCard: true,
    allowCompletedCardsInDeck: false,
    suggestContext: {
      builder: 'dream',
      tone: 'Atmospheric, specific, eerie, whimsical, and useful for stories.',
    },
    startCardKey: startCard,
    save,
    reset,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// CHARACTER  (adventure-builder.vue)
// ───────────────────────────────────────────────────────────────────────────

function buildCharacterConfig(): BuilderProjectConfig {
  const builder = useBuilderStore()
  const characterStore = useCharacterStore()
  const userStore = useUserStore()
  const { text, num, bool } = makeSheetReaders(builder)

  const startCard = 'role'

  const rarityValues = [
    'COMMON',
    'UNCOMMON',
    'RARE',
    'EPIC',
    'LEGENDARY',
    'MYTHIC',
  ] as const

  const rarity = (key: string): Rarity => {
    const value = text(key)
    return rarityValues.includes(value as Rarity) ? (value as Rarity) : 'COMMON'
  }

  function defaultCharacterSheet(): BuilderSheet {
    const form = characterStore.characterForm as Record<string, unknown>
    const sheet = defaultAdventureSheet(
      userStore.userId ?? userStore.user?.id ?? 10,
    )
    return {
      ...sheet,
      id: typeof form.id === 'number' ? form.id : null,
      name: typeof form.name === 'string' ? form.name : sheet.name,
      honorific:
        typeof form.honorific === 'string' ? form.honorific : sheet.honorific,
      title: typeof form.title === 'string' ? form.title : '',
      role: typeof form.role === 'string' ? form.role : '',
      genre: typeof form.genre === 'string' ? form.genre : sheet.genre,
      species: typeof form.species === 'string' ? form.species : sheet.species,
      class: typeof form.class === 'string' ? form.class : sheet.class,
      alignment:
        typeof form.alignment === 'string' ? form.alignment : sheet.alignment,
      gender: typeof form.gender === 'string' ? form.gender : sheet.gender,
      personality:
        typeof form.personality === 'string'
          ? form.personality
          : sheet.personality,
      backstory:
        typeof form.backstory === 'string' ? form.backstory : sheet.backstory,
      quirks: typeof form.quirks === 'string' ? form.quirks : sheet.quirks,
      artPrompt:
        typeof form.artPrompt === 'string' ? form.artPrompt : sheet.artPrompt,
      imagePath:
        typeof form.imagePath === 'string' ? form.imagePath : sheet.imagePath,
      artImageId:
        typeof form.artImageId === 'number'
          ? form.artImageId
          : sheet.artImageId,
      luck: typeof form.luck === 'string' ? form.luck : sheet.luck,
      might: typeof form.might === 'string' ? form.might : sheet.might,
      wits: typeof form.wits === 'string' ? form.wits : sheet.wits,
      grace: typeof form.grace === 'string' ? form.grace : sheet.grace,
      charm: typeof form.charm === 'string' ? form.charm : sheet.charm,
      empathy: typeof form.empathy === 'string' ? form.empathy : sheet.empathy,
      userId:
        typeof form.userId === 'number'
          ? form.userId
          : (userStore.userId ?? userStore.user?.id ?? 10),
      isPublic: typeof form.isPublic === 'boolean' ? form.isPublic : true,
      isMature: typeof form.isMature === 'boolean' ? form.isMature : false,
    }
  }

  function syncSheetToCharacterForm() {
    const resolvedUserId =
      num('userId') ?? userStore.userId ?? userStore.user?.id ?? 10
    syncAdventureStatTiers(builder.sheet)
    characterStore.setCharacterForm({
      id: num('id') ?? undefined,
      name: text('name'),
      honorific: text('honorific'),
      title: text('title'),
      role: text('role'),
      genre: text('genre'),
      species: text('species'),
      class: text('class'),
      alignment: text('alignment'),
      gender: text('gender'),
      presentation: text('presentation'),
      drive: text('drive'),
      achievements: text('achievements'),
      personality: text('personality'),
      backstory: text('backstory'),
      quirks: text('quirks'),
      artPrompt: text('artPrompt') || buildAdventureArtPrompt(builder.sheet),
      imagePath:
        typeof builder.sheet.imagePath === 'string'
          ? builder.sheet.imagePath
          : undefined,
      artImageId: num('artImageId') ?? undefined,
      luck: rarity('luck'),
      might: rarity('might'),
      wits: rarity('wits'),
      grace: rarity('grace'),
      charm: rarity('charm'),
      empathy: rarity('empathy'),
      userId: resolvedUserId,
      isPublic: bool('isPublic', true),
      isMature: bool('isMature', false),
      isActive: bool('isActive', true),
    })
  }

  async function save(): Promise<BuilderSaveResult> {
    builder.clearError()
    syncSheetToCharacterForm()
    const result = await characterStore.saveCharacter()
    if (result.success && result.data) {
      builder.setStatus('Character saved.')
      return { success: true, message: 'Character saved.', data: result.data }
    }
    const message =
      result.message || characterStore.error || 'Failed to save character.'
    builder.setLastError(new Error(message), message)
    return { success: false, message, data: result.data ?? null }
  }

  function reset() {
    characterStore.startAddingCharacter()
    builder.resetBuilder(true)
    builder.selectCard(startCard)
  }

  return {
    key: 'character',
    label: 'Character Builder',
    title: 'Character Builder',
    modelType: 'character',
    storageKey: 'kindrobots.builder.character.v1',
    cards: ADVENTURE_CARDS,
    splash: ADVENTURE_SPLASH,
    defaultSheet: defaultCharacterSheet,
    coreCardKeys: ADVENTURE_CORE_CARD_KEYS,
    requiredCardKeys: ADVENTURE_REQUIRED_CARD_KEYS,
    finalCardKey: 'art',
    artPurpose: 'character',
    artImageRole: 'avatar',
    artTitle: 'Character Portrait Designer',
    artDescription:
      'Create, upload, select, or generate portrait art for this character.',
    clearFieldDefaults: {
      imagePath: null,
      artImageId: null,
      userId: 10,
      isPublic: true,
      isMature: false,
      rewards: {},
      stats: [],
    },
    persistActiveCard: true,
    allowCompletedCardsInDeck: false,
    suggestContext: {
      builder: 'character',
      tone: 'Disco Elysium meets Douglas Adams, playable, strange, and vivid.',
    },
    startCardKey: startCard,
    save,
    reset,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// REWARD
// ───────────────────────────────────────────────────────────────────────────

function buildRewardConfig(): BuilderProjectConfig {
  const builder = useBuilderStore()
  const rewardStore = useRewardStore()
  const userStore = useUserStore()
  const { text, num, bool } = makeSheetReaders(builder)

  const startCard = 'type'

  const rewardTypeValues = [
    'SKILL',
    'ITEM',
    'TREASURE',
    'TITLE',
    'POWER',
    'STORY',
  ] as const
  const rarityValues = [
    'COMMON',
    'UNCOMMON',
    'RARE',
    'EPIC',
    'LEGENDARY',
    'MYTHIC',
  ] as const

  const rewardType = (key: string): RewardType => {
    const value = text(key)
    return rewardTypeValues.includes(value as RewardType)
      ? (value as RewardType)
      : 'SKILL'
  }
  const rarity = (key: string): Rarity => {
    const value = text(key)
    return rarityValues.includes(value as Rarity) ? (value as Rarity) : 'COMMON'
  }

  function defaultRewardSheet(): BuilderSheet {
    const form = rewardStore.rewardForm as Record<string, unknown>
    return {
      rewardType:
        typeof form.rewardType === 'string' ? form.rewardType : 'ITEM',
      rarity: typeof form.rarity === 'string' ? form.rarity : 'COMMON',
      icon: typeof form.icon === 'string' ? form.icon : 'kind-icon:gift',
      text: typeof form.text === 'string' ? form.text : '',
      power: typeof form.power === 'string' ? form.power : '',
      collection:
        typeof form.collection === 'string'
          ? form.collection
          : 'starting-character-reward',
      label: typeof form.label === 'string' ? form.label : '',
      imagePath: typeof form.imagePath === 'string' ? form.imagePath : null,
      artPrompt: typeof form.artPrompt === 'string' ? form.artPrompt : '',
      artImageId: typeof form.artImageId === 'number' ? form.artImageId : null,
      userId:
        typeof form.userId === 'number'
          ? form.userId
          : (userStore.userId ?? userStore.user?.id ?? 10),
      isPublic: typeof form.isPublic === 'boolean' ? form.isPublic : true,
      isMature: typeof form.isMature === 'boolean' ? form.isMature : false,
      isActive: typeof form.isActive === 'boolean' ? form.isActive : true,
    }
  }

  function syncSheetToRewardForm() {
    const resolvedUserId =
      num('userId') ?? userStore.userId ?? userStore.user?.id ?? 10
    rewardStore.rewardForm = {
      ...rewardStore.rewardForm,
      rewardType: rewardType('rewardType'),
      rarity: rarity('rarity'),
      icon: text('icon') || 'kind-icon:gift',
      text: text('text'),
      power: text('power'),
      collection: text('collection') || 'starting-character-reward',
      label: text('label'),
      imagePath:
        typeof builder.sheet.imagePath === 'string'
          ? builder.sheet.imagePath
          : undefined,
      artPrompt: text('artPrompt'),
      artImageId: num('artImageId') ?? undefined,
      userId: resolvedUserId,
      isPublic: bool('isPublic', true),
      isMature: bool('isMature', false),
      isActive: bool('isActive', true),
    }
  }

  async function save(): Promise<BuilderSaveResult> {
    builder.clearError()
    syncSheetToRewardForm()
    const reward = await rewardStore.saveReward()
    if (reward?.id) {
      builder.setStatus('Reward saved.')
      return { success: true, message: 'Reward saved.', data: reward }
    }
    const message = rewardStore.error || 'Failed to save reward.'
    builder.setLastError(new Error(message), message)
    return { success: false, message, data: null }
  }

  function reset() {
    rewardStore.startAddingReward()
    builder.resetBuilder(true)
    builder.selectCard(startCard)
  }

  return {
    key: 'reward',
    label: 'Reward Builder',
    title: 'Reward Builder',
    modelType: 'reward',
    storageKey: 'kindrobots.builder.reward.v1',
    cards: REWARD_CARDS,
    splash: {
      title: 'Reward Builder',
      subtitle: 'Create skills, items, titles, powers, and story trouble.',
      tagline: 'A prize, a problem, or both. Ideally both.',
      description:
        'Build a reward one card at a time: type, rarity, name, power, collection, visibility, and optional art.',
      imagePath: '/images/rewards/splash.webp',
      ctaLabel: 'Start Reward',
      secondaryLabel: 'Surprise Me',
    },
    defaultSheet: defaultRewardSheet,
    coreCardKeys: ['type', 'rarity', 'name', 'power'],
    requiredCardKeys: ['type', 'rarity', 'name', 'power'],
    finalCardKey: 'art',
    artPurpose: 'reward',
    artImageRole: 'object',
    artTitle: 'Reward Image Designer',
    artDescription: 'Create, upload, select, or generate art for this reward.',
    clearFieldDefaults: {
      imagePath: null,
      artImageId: null,
      userId: 10,
      isPublic: true,
      isMature: false,
      isActive: true,
    },
    persistActiveCard: true,
    allowCompletedCardsInDeck: false,
    suggestContext: {
      builder: 'reward',
      tone: 'Punchy, flavorful, useful in interactive narrative play.',
    },
    startCardKey: startCard,
    save,
    reset,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// SCENARIO
// ───────────────────────────────────────────────────────────────────────────

function buildScenarioConfig(): BuilderProjectConfig {
  const builder = useBuilderStore()
  const scenarioStore = useScenarioStore()
  const userStore = useUserStore()
  const { text, num, bool } = makeSheetReaders(builder)

  const startCard = 'genre'

  function normalizeArrayField(value: BuilderFieldValue): string[] {
    if (Array.isArray(value)) {
      return value.filter((entry): entry is string => typeof entry === 'string')
    }
    if (typeof value === 'string') {
      return value
        .split(/\n---\n|\|/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    }
    return []
  }
  const joinTextBlock = (value: BuilderFieldValue) =>
    normalizeArrayField(value).join('\n---\n')
  const joinPiped = (value: BuilderFieldValue) =>
    normalizeArrayField(value).join('|')

  function defaultScenarioSheet(): BuilderSheet {
    const form = scenarioStore.scenarioForm as Record<string, unknown>
    return {
      title: typeof form.title === 'string' ? form.title : '',
      description: typeof form.description === 'string' ? form.description : '',
      intros: normalizeArrayField(form.intros as BuilderFieldValue),
      genres: normalizeArrayField(form.genres as BuilderFieldValue),
      inspirations: normalizeArrayField(form.inspirations as BuilderFieldValue),
      locations: normalizeArrayField(form.locations as BuilderFieldValue),
      tier: typeof form.tier === 'string' ? form.tier : '',
      group: typeof form.group === 'string' ? form.group : '',
      difficulty: typeof form.difficulty === 'number' ? form.difficulty : 1,
      secretNotes: typeof form.secretNotes === 'string' ? form.secretNotes : '',
      artPrompt: typeof form.artPrompt === 'string' ? form.artPrompt : '',
      imagePath: typeof form.imagePath === 'string' ? form.imagePath : null,
      artImageId: typeof form.artImageId === 'number' ? form.artImageId : null,
      userId:
        typeof form.userId === 'number'
          ? form.userId
          : (userStore.userId ?? userStore.user?.id ?? 10),
      isPublic: typeof form.isPublic === 'boolean' ? form.isPublic : true,
      isMature: typeof form.isMature === 'boolean' ? form.isMature : false,
      isActive: typeof form.isActive === 'boolean' ? form.isActive : true,
    }
  }

  function syncSheetToScenarioForm() {
    const resolvedUserId =
      num('userId') ?? userStore.userId ?? userStore.user?.id ?? 10
    scenarioStore.scenarioForm = {
      ...scenarioStore.scenarioForm,
      title: text('title'),
      description: text('description'),
      intros: joinTextBlock(builder.sheet.intros),
      genres: joinPiped(builder.sheet.genres),
      inspirations: joinTextBlock(builder.sheet.inspirations),
      locations: joinTextBlock(builder.sheet.locations),
      tier: text('tier'),
      group: text('group'),
      difficulty: num('difficulty') ?? 1,
      secretNotes: text('secretNotes'),
      artPrompt: text('artPrompt'),
      imagePath:
        typeof builder.sheet.imagePath === 'string'
          ? builder.sheet.imagePath
          : undefined,
      artImageId: num('artImageId') ?? undefined,
      userId: resolvedUserId,
      isPublic: bool('isPublic', true),
      isMature: bool('isMature', false),
      isActive: bool('isActive', true),
    }
  }

  async function save(): Promise<BuilderSaveResult> {
    builder.clearError()
    syncSheetToScenarioForm()
    const scenario = await scenarioStore.saveScenario()
    if (scenario) {
      builder.setStatus('Scenario saved.')
      return { success: true, message: 'Scenario saved.', data: scenario }
    }
    const message = 'Failed to save scenario.'
    builder.setLastError(new Error(message), message)
    return { success: false, message, data: null }
  }

  function reset() {
    scenarioStore.scenarioForm = {
      ...scenarioStore.scenarioForm,
      title: '',
      description: '',
      intros: '',
      genres: '',
      inspirations: '',
      locations: '',
      tier: '',
      group: '',
      difficulty: 1,
      secretNotes: '',
      artPrompt: '',
      imagePath: null,
      artImageId: null,
      userId: userStore.userId ?? userStore.user?.id ?? 10,
      isPublic: true,
      isMature: false,
      isActive: true,
    }
    builder.resetBuilder(true)
    builder.selectCard(startCard)
  }

  return {
    key: 'scenario',
    label: 'Scenario Builder',
    title: 'Scenario Builder',
    modelType: 'scenario',
    storageKey: 'kindrobots.builder.scenario.v1',
    cards: SCENARIO_CARDS,
    splash: {
      title: 'Scenario Builder',
      subtitle: 'Create a moment with choices, consequences, and trouble.',
      tagline: 'A tiny machine for narrative complications.',
      description:
        'Build a scenario one card at a time: genre, title, description, intros, classification, secrets, visibility, and art.',
      imagePath: '/images/scenarios/splash.webp',
      ctaLabel: 'Start Scenario',
      secondaryLabel: 'Surprise Me',
    },
    defaultSheet: defaultScenarioSheet,
    coreCardKeys: ['genre', 'title', 'description', 'intros'],
    requiredCardKeys: ['genre', 'title', 'description', 'intros'],
    finalCardKey: 'art',
    artPurpose: 'scenario',
    artImageRole: 'scene',
    artTitle: 'Scenario Image Designer',
    artDescription:
      'Create, upload, select, or generate scene art for this scenario.',
    clearFieldDefaults: {
      imagePath: null,
      artImageId: null,
      userId: 10,
      isPublic: true,
      isMature: false,
      isActive: true,
      intros: [],
      genres: [],
      inspirations: [],
      locations: [],
      difficulty: 1,
    },
    persistActiveCard: true,
    allowCompletedCardsInDeck: false,
    suggestContext: {
      builder: 'scenario',
      tone: 'Interactive, punchy, playable, and rich with choice pressure.',
    },
    startCardKey: startCard,
    save,
    reset,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// PITCH
// ───────────────────────────────────────────────────────────────────────────

function buildPitchConfig(): BuilderProjectConfig {
  const builder = useBuilderStore()
  const pitchStore = usePitchStore()
  const userStore = useUserStore()
  const { text, num, bool } = makeSheetReaders(builder)

  const startCard = 'type'

  type PitchBuilderType = 'ARTPITCH' | 'DREAM'
  const getPitchType = (): PitchBuilderType =>
    text('PitchType') === 'DREAM' ? 'DREAM' : 'ARTPITCH'

  function defaultPitchSheet(): BuilderSheet {
    const form = pitchStore.pitchForm as Record<string, unknown>
    return {
      PitchType:
        form.PitchType === 'DREAM' || form.PitchType === 'ARTPITCH'
          ? form.PitchType
          : 'ARTPITCH',
      title: typeof form.title === 'string' ? form.title : '',
      pitch: typeof form.pitch === 'string' ? form.pitch : '',
      description: typeof form.description === 'string' ? form.description : '',
      artPrompt: typeof form.artPrompt === 'string' ? form.artPrompt : '',
      artImageId: typeof form.artImageId === 'number' ? form.artImageId : null,
      designer: typeof form.designer === 'string' ? form.designer : null,
      userId:
        typeof form.userId === 'number'
          ? form.userId
          : (userStore.userId ?? userStore.user?.id ?? 10),
      isPublic: typeof form.isPublic === 'boolean' ? form.isPublic : true,
      isMature: typeof form.isMature === 'boolean' ? form.isMature : false,
    }
  }

  function syncSheetToPitchForm() {
    const resolvedUserId =
      num('userId') ?? userStore.userId ?? userStore.user?.id ?? 10
    pitchStore.setPitchForm({
      PitchType: getPitchType(),
      title: text('title'),
      pitch: text('pitch'),
      description: text('description'),
      artPrompt: text('artPrompt'),
      artImageId: num('artImageId') ?? undefined,
      designer:
        typeof builder.sheet.designer === 'string'
          ? builder.sheet.designer
          : undefined,
      userId: resolvedUserId,
      isPublic: bool('isPublic', true),
      isMature: bool('isMature', false),
    })
  }

  async function save(): Promise<BuilderSaveResult> {
    builder.clearError()
    syncSheetToPitchForm()
    const result = await pitchStore.savePitch()
    if (result.success && result.data) {
      builder.setStatus('Pitch saved.')
      return { success: true, message: 'Pitch saved.', data: result.data }
    }
    const message =
      result.message || pitchStore.lastError || 'Failed to save pitch.'
    builder.setLastError(new Error(message), message)
    return { success: false, message, data: result.data ?? null }
  }

  function reset() {
    pitchStore.startAddingPitch()
    builder.resetBuilder(true)
    builder.selectCard(startCard)
  }

  return {
    key: 'pitch',
    label: 'Pitch Builder',
    title: 'Pitch Builder',
    modelType: 'pitch',
    storageKey: 'kindrobots.builder.pitch.v1',
    cards: PITCH_CARDS,
    splash: {
      title: 'Pitch Builder',
      subtitle: 'Fast seeds for images, dreams, and narrative weirdness.',
      tagline: 'One good sentence. Many possible disasters.',
      description:
        'Build a pitch one card at a time: type, core sentence, supporting details, visibility, and optional art.',
      imagePath: '/images/pitch/splash.webp',
      ctaLabel: 'Start Pitch',
      secondaryLabel: 'Surprise Me',
    },
    defaultSheet: defaultPitchSheet,
    coreCardKeys: ['type', 'pitch'],
    requiredCardKeys: ['type', 'pitch'],
    finalCardKey: 'art',
    artPurpose: 'pitch',
    artImageRole: 'cover',
    artTitle: 'Pitch Image Designer',
    artDescription: 'Create, upload, select, or generate art for this pitch.',
    clearFieldDefaults: {
      artImageId: null,
      userId: 10,
      isPublic: true,
      isMature: false,
    },
    persistActiveCard: true,
    allowCompletedCardsInDeck: false,
    suggestContext: {
      builder: 'pitch',
      tone: 'Concise, visual, strange, and immediately generative.',
    },
    startCardKey: startCard,
    save,
    reset,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// The registration store
// ───────────────────────────────────────────────────────────────────────────

// Each entry is a thunk so construction is lazy and happens inside the
// Pinia-active call to registerAll(), guaranteeing the model stores resolve.
type ConfigBuilder = () => BuilderProjectConfig

const CONFIG_BUILDERS: ConfigBuilder[] = [
  buildUserConfig,
  buildPitchConfig,
  buildDreamConfig,
  buildCharacterConfig,
  buildBotConfig,
  buildRewardConfig,
  buildScenarioConfig,
]

export const useRegisterBuilderStore = defineStore(
  'registerBuilderStore',
  () => {
    const isRegistered = ref(false)
    const registeredKeys = ref<string[]>([])

    function registerAll(force = false): string[] {
      if (isRegistered.value && !force) return registeredKeys.value

      const builder = useBuilderStore()
      const keys: string[] = []

      for (const build of CONFIG_BUILDERS) {
        const config = build()
        builder.registerBuilder(config)
        keys.push(config.key)
      }

      registeredKeys.value = keys
      isRegistered.value = true
      return keys
    }

    return {
      isRegistered,
      registeredKeys,
      registerAll,
    }
  },
)

// Convenience wrapper for callers that just want it done (e.g. kind-loader).
export function ensureBuildersRegistered(force = false): string[] {
  return useRegisterBuilderStore().registerAll(force)
}
