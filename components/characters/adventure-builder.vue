<!-- /components/characters/adventure-builder.vue -->
<template>
  <div class="hidden" aria-hidden="true" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
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
import type {
  BuilderProjectConfig,
  BuilderSaveResult,
  BuilderSheet,
} from '@/stores/helpers/builderCards'
import { useBuilderStore } from '@/stores/builderStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useUserStore } from '@/stores/userStore'
import type { Rarity } from '~/prisma/generated/prisma/client'

const builder = useBuilderStore()
const characterStore = useCharacterStore()
const userStore = useUserStore()

const builderKey = 'character'
const startCard = 'role'

const rarityValues = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
] as const

function sheetText(key: string): string {
  const value = builder.sheet[key]

  return typeof value === 'string' ? value : ''
}

function sheetNumber(key: string): number | null {
  const value = builder.sheet[key]

  return typeof value === 'number' ? value : null
}

function sheetBoolean(key: string, fallback = false): boolean {
  const value = builder.sheet[key]

  return typeof value === 'boolean' ? value : fallback
}

function sheetRarity(key: string): Rarity {
  const value = sheetText(key)

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
      typeof form.artImageId === 'number' ? form.artImageId : sheet.artImageId,
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
    sheetNumber('userId') ?? userStore.userId ?? userStore.user?.id ?? 10

  syncAdventureStatTiers(builder.sheet)

  characterStore.setCharacterForm({
    id: sheetNumber('id') ?? undefined,
    name: sheetText('name'),
    honorific: sheetText('honorific'),
    title: sheetText('title'),
    role: sheetText('role'),
    genre: sheetText('genre'),
    species: sheetText('species'),
    class: sheetText('class'),
    alignment: sheetText('alignment'),
    gender: sheetText('gender'),
    presentation: sheetText('presentation'),
    drive: sheetText('drive'),
    achievements: sheetText('achievements'),
    personality: sheetText('personality'),
    backstory: sheetText('backstory'),
    quirks: sheetText('quirks'),
    artPrompt: sheetText('artPrompt') || buildAdventureArtPrompt(builder.sheet),
    imagePath:
      typeof builder.sheet.imagePath === 'string'
        ? builder.sheet.imagePath
        : undefined,
    artImageId: sheetNumber('artImageId') ?? undefined,
    luck: sheetRarity('luck'),
    might: sheetRarity('might'),
    wits: sheetRarity('wits'),
    grace: sheetRarity('grace'),
    charm: sheetRarity('charm'),
    empathy: sheetRarity('empathy'),
    userId: resolvedUserId,
    isPublic: sheetBoolean('isPublic', true),
    isMature: sheetBoolean('isMature', false),
    isActive: sheetBoolean('isActive', true),
  })
}

async function saveCharacterBuilder(): Promise<BuilderSaveResult> {
  builder.clearError()
  syncSheetToCharacterForm()

  const result = await characterStore.saveCharacter()

  if (result.success && result.data) {
    builder.setStatus('Character saved.')

    return {
      success: true,
      message: 'Character saved.',
      data: result.data,
    }
  }

  const message =
    result.message || characterStore.error || 'Failed to save character.'

  builder.setLastError(new Error(message), message)

  return {
    success: false,
    message,
    data: result.data ?? null,
  }
}

function resetCharacterBuilder() {
  characterStore.startAddingCharacter()
  builder.resetBuilder(true)
  builder.selectCard(startCard)
}

const characterBuilderConfig: BuilderProjectConfig = {
  key: builderKey,
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
  save: saveCharacterBuilder,
  reset: resetCharacterBuilder,
}

onMounted(() => {
  builder.registerBuilder(characterBuilderConfig)
  builder.setBuilder(builderKey, true)

  if (!builder.activeCardKey && builder.visibleCards.length) {
    builder.selectCard(startCard)
  }
})
</script>
