<!-- /components/pitches/pitch-builder.vue -->
<template>
  <div class="hidden" aria-hidden="true" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { PITCH_CARDS } from '@/stores/helpers/pitchCards'
import type {
  BuilderProjectConfig,
  BuilderSaveResult,
  BuilderSheet,
} from '@/stores/helpers/builderCards'
import { useBuilderStore } from '@/stores/builderStore'
import { usePitchStore } from '@/stores/pitchStore'
import { useUserStore } from '@/stores/userStore'

type PitchBuilderType = 'ARTPITCH' | 'DREAM'

const builder = useBuilderStore()
const pitchStore = usePitchStore()
const userStore = useUserStore()

const builderKey = 'pitch'
const startCard = 'type'

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

function getPitchType(): PitchBuilderType {
  return sheetText('PitchType') === 'DREAM' ? 'DREAM' : 'ARTPITCH'
}

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
    sheetNumber('userId') ?? userStore.userId ?? userStore.user?.id ?? 10

  pitchStore.setPitchForm({
    PitchType: getPitchType(),
    title: sheetText('title'),
    pitch: sheetText('pitch'),
    description: sheetText('description'),
    artPrompt: sheetText('artPrompt'),
    artImageId: sheetNumber('artImageId') ?? undefined,
    designer:
      typeof builder.sheet.designer === 'string'
        ? builder.sheet.designer
        : undefined,
    userId: resolvedUserId,
    isPublic: sheetBoolean('isPublic', true),
    isMature: sheetBoolean('isMature', false),
  })
}

async function savePitchBuilder(): Promise<BuilderSaveResult> {
  builder.clearError()
  syncSheetToPitchForm()

  const result = await pitchStore.savePitch()

  if (result.success && result.data) {
    builder.setStatus('Pitch saved.')

    return {
      success: true,
      message: 'Pitch saved.',
      data: result.data,
    }
  }

  const message =
    result.message || pitchStore.lastError || 'Failed to save pitch.'

  builder.setLastError(new Error(message), message)

  return {
    success: false,
    message,
    data: result.data ?? null,
  }
}

function resetPitchBuilder() {
  pitchStore.startAddingPitch()
  builder.resetBuilder(true)
  builder.selectCard(startCard)
}

const pitchBuilderConfig: BuilderProjectConfig = {
  key: builderKey,
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
  save: savePitchBuilder,
  reset: resetPitchBuilder,
}

onMounted(() => {
  builder.registerBuilder(pitchBuilderConfig)
  builder.setBuilder(builderKey, true)

  if (!builder.activeCardKey && builder.visibleCards.length) {
    builder.selectCard(startCard)
  }
})
</script>
