<!-- /components/scenarios/scenario-builder.vue -->
<template>
  <div class="hidden" aria-hidden="true" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { SCENARIO_CARDS } from '@/stores/helpers/scenarioCards'
import type {
  BuilderFieldValue,
  BuilderProjectConfig,
  BuilderSaveResult,
  BuilderSheet,
} from '@/stores/helpers/builderCards'
import { useBuilderStore } from '@/stores/builderStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUserStore } from '@/stores/userStore'

const builder = useBuilderStore()
const scenarioStore = useScenarioStore()
const userStore = useUserStore()

const builderKey = 'scenario'
const startCard = 'genre'

function sheetText(key: string): string {
  const value = builder.sheet[key]

  return typeof value === 'string' ? value : ''
}

function sheetNumber(key: string): number | null {
  const value = builder.sheet[key]

  if (typeof value === 'number') return value

  if (typeof value === 'string') {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function sheetBoolean(key: string, fallback = false): boolean {
  const value = builder.sheet[key]

  return typeof value === 'boolean' ? value : fallback
}

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

function joinTextBlock(value: BuilderFieldValue): string {
  return normalizeArrayField(value).join('\n---\n')
}

function joinPiped(value: BuilderFieldValue): string {
  return normalizeArrayField(value).join('|')
}

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
    sheetNumber('userId') ?? userStore.userId ?? userStore.user?.id ?? 10

  scenarioStore.scenarioForm = {
    ...scenarioStore.scenarioForm,
    title: sheetText('title'),
    description: sheetText('description'),
    intros: joinTextBlock(builder.sheet.intros),
    genres: joinPiped(builder.sheet.genres),
    inspirations: joinTextBlock(builder.sheet.inspirations),
    locations: joinTextBlock(builder.sheet.locations),
    tier: sheetText('tier'),
    group: sheetText('group'),
    difficulty: sheetNumber('difficulty') ?? 1,
    secretNotes: sheetText('secretNotes'),
    artPrompt: sheetText('artPrompt'),
    imagePath:
      typeof builder.sheet.imagePath === 'string'
        ? builder.sheet.imagePath
        : undefined,
    artImageId: sheetNumber('artImageId') ?? undefined,
    userId: resolvedUserId,
    isPublic: sheetBoolean('isPublic', true),
    isMature: sheetBoolean('isMature', false),
    isActive: sheetBoolean('isActive', true),
  }
}

async function saveScenarioBuilder(): Promise<BuilderSaveResult> {
  builder.clearError()
  syncSheetToScenarioForm()

  const scenario = await scenarioStore.saveScenario()

  if (scenario) {
    builder.setStatus('Scenario saved.')

    return {
      success: true,
      message: 'Scenario saved.',
      data: scenario,
    }
  }

  const message = 'Failed to save scenario.'

  builder.setLastError(new Error(message), message)

  return {
    success: false,
    message,
    data: null,
  }
}

function resetScenarioBuilder() {
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

const scenarioBuilderConfig: BuilderProjectConfig = {
  key: builderKey,
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
  save: saveScenarioBuilder,
  reset: resetScenarioBuilder,
}

onMounted(() => {
  builder.registerBuilder(scenarioBuilderConfig)
  builder.setBuilder(builderKey, true)

  if (!builder.activeCardKey && builder.visibleCards.length) {
    builder.selectCard(startCard)
  }
})
</script>
