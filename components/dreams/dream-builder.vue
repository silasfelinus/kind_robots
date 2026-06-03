<!-- /components/dreams/dream-builder.vue -->
<template>
  <div class="hidden" aria-hidden="true" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { DREAM_CARDS } from '@/stores/helpers/dreamCards'
import type {
  BuilderProjectConfig,
  BuilderSheet,
} from '@/stores/helpers/builderCards'
import { useBuilderStore } from '@/stores/builderStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useUserStore } from '@/stores/userStore'

type DreamAccessMode = 'OPEN' | 'PRIVATE' | 'CODE'

const builder = useBuilderStore()
const dreamStore = useDreamStore()
const userStore = useUserStore()

const builderKey = 'dream'

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
    privacyCode:
      typeof form.privacyCode === 'string' ? form.privacyCode : '',
    artPrompt: typeof form.artPrompt === 'string' ? form.artPrompt : '',
    imagePath: typeof form.imagePath === 'string' ? form.imagePath : null,
    artImageId: typeof form.artImageId === 'number' ? form.artImageId : null,
    userId:
      typeof form.userId === 'number'
        ? form.userId
        : userStore.userId || userStore.user?.id || 10,
    isPublic: typeof form.isPublic === 'boolean' ? form.isPublic : true,
    isMature: typeof form.isMature === 'boolean' ? form.isMature : false,
  }
}

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

function getAccessMode(): DreamAccessMode {
  const value = sheetText('accessMode')

  if (value === 'PRIVATE' || value === 'CODE') return value

  return 'OPEN'
}

function syncSheetToDreamForm() {
  const mode = getAccessMode()
  const resolvedUserId =
    sheetNumber('userId') ?? userStore.userId ?? userStore.user?.id ?? 10

  dreamStore.setDreamForm({
    title: sheetText('title'),
    description: sheetText('description'),
    currentVibe: sheetText('currentVibe'),
    currentPrompt: sheetText('currentPrompt'),
    accessMode: mode,
    privacyCode: mode === 'CODE' ? sheetText('privacyCode') : '',
    artPrompt: sheetText('artPrompt'),
    imagePath:
      typeof builder.sheet.imagePath === 'string'
        ? builder.sheet.imagePath
        : undefined,
    artImageId: sheetNumber('artImageId') ?? undefined,
    userId: resolvedUserId,
    isPublic: sheetBoolean('isPublic', true),
    isMature: sheetBoolean('isMature', false),
  })
}

async function saveDreamBuilder() {
  builder.clearError()
  syncSheetToDreamForm()

  const result = await dreamStore.saveDream()

  if (result.success && result.data) {
    builder.setStatus('Dream saved.')
    return result
  }

  builder.setError(result.message ?? dreamStore.error ?? 'Save failed.')
  return result
}

function resetDreamBuilder() {
  dreamStore.startAddingDream()
  builder.resetBuilder(true)
  builder.selectCard('atmosphere')
}

const dreamBuilderConfig: BuilderProjectConfig = {
  key: builderKey,
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
    imagePath: null,
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
  payload: {
    save: saveDreamBuilder,
    reset: resetDreamBuilder,
    startCard: 'atmosphere',
  },
}

onMounted(() => {
  builder.registerBuilder(dreamBuilderConfig)
  builder.setBuilder(builderKey, true)

  if (!builder.activeCardKey && builder.visibleCards.length) {
    builder.selectCard('atmosphere')
  }
})
</script>