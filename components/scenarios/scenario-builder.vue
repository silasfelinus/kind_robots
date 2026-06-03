<!-- /components/scenarios/scenario-builder.vue -->
<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden">
    <header
      class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100/80 px-4 py-2.5 backdrop-blur-sm"
    >
      <div class="flex items-center gap-2.5">
        <Icon name="kind-icon:layers" class="h-5 w-5 text-primary" />

        <h1 class="text-lg font-black tracking-tight">Scenario Builder</h1>

        <span
          v-if="tier"
          class="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary capitalize"
        >
          {{ tier }}
        </span>

        <span
          v-if="difficulty !== null"
          class="rounded-full border border-base-300 px-2.5 py-0.5 text-xs font-bold text-base-content/50"
        >
          diff {{ difficulty }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-ghost rounded-xl text-base-content/40 hover:text-error"
          :disabled="isSaving"
          @click="showResetConfirm = true"
        >
          <Icon name="kind-icon:trash" class="h-4 w-4" />
          <span class="hidden sm:inline">Reset</span>
        </button>

        <button
          type="button"
          class="btn btn-sm btn-primary gap-1.5 rounded-xl"
          :disabled="!canSave || isSaving"
          @click="doSave"
        >
          <span v-if="isSaving" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:save" class="h-4 w-4" />
          <span class="hidden sm:inline">Save</span>
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside
        v-if="!isMobile"
        class="flex w-64 shrink-0 flex-col border-r border-base-300 bg-base-100/60 backdrop-blur-sm"
      >
        <builder-sheet />
      </aside>

      <main class="flex flex-1 flex-col overflow-hidden">
        <builder-stage class="flex-1 overflow-y-auto" />
      </main>
    </div>

    <builder-hand
      class="shrink-0 border-t border-base-300 bg-base-100/80 backdrop-blur-sm"
    />

    <Transition name="fade">
      <div
        v-if="showResetConfirm"
        class="absolute inset-0 z-50 flex items-center justify-center bg-base-300/60 backdrop-blur-sm"
        @click.self="showResetConfirm = false"
      >
        <div
          class="rounded-3xl border border-base-300 bg-base-100 p-8 shadow-2xl"
        >
          <p class="mb-1 text-lg font-black">Reset scenario?</p>

          <p class="mb-6 text-sm text-base-content/60">
            Clears everything and starts fresh.
          </p>

          <div class="flex gap-3">
            <button
              type="button"
              class="btn btn-outline rounded-xl"
              @click="showResetConfirm = false"
            >
              Cancel
            </button>

            <button
              type="button"
              class="btn btn-error rounded-xl"
              @click="doReset"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="feedback"
        class="absolute bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg"
        :class="
          isError
            ? 'bg-error text-error-content'
            : 'bg-success text-success-content'
        "
      >
        {{ feedback }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { SCENARIO_CARDS } from '@/stores/helpers/scenarioCards'
import type {
  BuilderFieldValue,
  BuilderProjectConfig,
  BuilderSheet,
} from '@/stores/helpers/builderCards'
import { useBuilderStore } from '@/stores/builderStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUserStore } from '@/stores/userStore'

const builder = useBuilderStore()
const scenarioStore = useScenarioStore()
const userStore = useUserStore()

const scenarioBuilderKey = 'scenario'

const isMobile = ref(false)
const showResetConfirm = ref(false)
const feedback = ref('')
const isError = ref(false)

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

function sheetStringArray(key: string): string[] {
  const value = builder.sheet[key]

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }

  if (typeof value === 'string') {
    return value
      .split('|')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return []
}

const tier = computed(() => sheetText('tier'))

const difficulty = computed(() => {
  const value = builder.sheet.difficulty

  if (typeof value === 'number') return value

  if (typeof value === 'string') {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
  }

  return null
})

const isSaving = computed(() => {
  return Boolean(builder.isSaving || scenarioStore.isSaving)
})

const canSave = computed(() => {
  return (
    Boolean(sheetText('title').trim()) &&
    Boolean(sheetText('description').trim()) &&
    sheetStringArray('intros').some((entry) => entry.trim()) &&
    !isSaving.value
  )
})

function defaultScenarioSheet(): BuilderSheet {
  const form = scenarioStore.scenarioForm as Record<string, unknown>

  return {
    title: typeof form.title === 'string' ? form.title : '',
    description:
      typeof form.description === 'string' ? form.description : '',
    intros: Array.isArray(form.intros)
      ? form.intros.filter(
          (entry): entry is string => typeof entry === 'string',
        )
      : [],
    genres: Array.isArray(form.genres)
      ? form.genres.filter(
          (entry): entry is string => typeof entry === 'string',
        )
      : [],
    inspirations: Array.isArray(form.inspirations)
      ? form.inspirations.filter(
          (entry): entry is string => typeof entry === 'string',
        )
      : [],
    locations: Array.isArray(form.locations)
      ? form.locations.filter(
          (entry): entry is string => typeof entry === 'string',
        )
      : [],
    tier: typeof form.tier === 'string' ? form.tier : '',
    group: typeof form.group === 'string' ? form.group : '',
    difficulty:
      typeof form.difficulty === 'number' ? form.difficulty : 1,
    secretNotes:
      typeof form.secretNotes === 'string' ? form.secretNotes : '',
    artPrompt: typeof form.artPrompt === 'string' ? form.artPrompt : '',
    imagePath: typeof form.imagePath === 'string' ? form.imagePath : null,
    artImageId:
      typeof form.artImageId === 'number' ? form.artImageId : null,
    userId:
      typeof form.userId === 'number'
        ? form.userId
        : userStore.userId || userStore.user?.id || 10,
    isPublic: typeof form.isPublic === 'boolean' ? form.isPublic : true,
    isMature: typeof form.isMature === 'boolean' ? form.isMature : false,
  }
}

const scenarioBuilderConfig: BuilderProjectConfig = {
  key: scenarioBuilderKey,
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
}

function updateBreakpoint() {
  if (typeof window === 'undefined') return

  isMobile.value = window.innerWidth < 1024
}

function normalizeArrayField(value: BuilderFieldValue): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }

  if (typeof value === 'string') {
    return value
      .split('|')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return []
}

function syncSheetToScenarioForm() {
  const resolvedUserId =
    sheetNumber('userId') ?? userStore.userId ?? userStore.user?.id ?? 10

  scenarioStore.setScenarioForm({
    title: sheetText('title'),
    description: sheetText('description'),
    intros: normalizeArrayField(builder.sheet.intros),
    genres: normalizeArrayField(builder.sheet.genres),
    inspirations: normalizeArrayField(builder.sheet.inspirations),
    locations: normalizeArrayField(builder.sheet.locations),
    tier: sheetText('tier'),
    group: sheetText('group'),
    difficulty: difficulty.value ?? 1,
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
  })
}

function initializeBuilder() {
  builder.registerBuilder(scenarioBuilderConfig)
  builder.setBuilder(scenarioBuilderKey, true)

  if (!builder.activeCardKey && builder.visibleCards.length) {
    builder.selectCard('genre')
  }
}

onMounted(() => {
  initializeBuilder()
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateBreakpoint)
})

function doReset() {
  showResetConfirm.value = false
  scenarioStore.startAddingScenario()
  builder.resetBuilder(true)
  builder.selectCard('genre')
}

async function doSave() {
  feedback.value = ''
  builder.clearError()
  syncSheetToScenarioForm()

  const result = await scenarioStore.saveScenario()

  if (result?.id) {
    feedback.value = 'Scenario saved.'
    isError.value = false
    builder.setStatus('Scenario saved.')
  } else {
    feedback.value =
      builder.lastError ?? scenarioStore.error ?? 'Save failed.'
    isError.value = true
  }

  window.setTimeout(() => {
    feedback.value = ''
  }, 3000)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition:
    opacity 200ms ease,
    transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1);
}

.slide-up-leave-active {
  transition: opacity 150ms ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>