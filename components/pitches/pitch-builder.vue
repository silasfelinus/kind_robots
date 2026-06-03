<!-- /components/pitch/pitch-builder.vue -->
<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden">
    <header
      class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100/80 px-4 py-2.5 backdrop-blur-sm"
    >
      <div class="flex items-center gap-2.5">
        <Icon name="kind-icon:layers" class="h-5 w-5 text-primary" />

        <h1 class="text-lg font-black tracking-tight text-base-content">
          Pitch Builder
        </h1>

        <span
          v-if="pitchType"
          class="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary"
        >
          {{ pitchType === 'ARTPITCH' ? 'Art Pitch' : 'Dream' }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-ghost rounded-xl text-base-content/40 hover:text-error"
          :disabled="isSaving"
          @click="confirmReset"
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
        <pitch-sheet />
      </aside>

      <main class="flex flex-1 flex-col overflow-hidden">
        <pitch-stage class="flex-1 overflow-y-auto" />
      </main>
    </div>

    <pitch-hand
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
          <p class="mb-1 text-lg font-black text-base-content">Reset pitch?</p>

          <p class="mb-6 text-sm text-base-content/60">
            This clears everything and starts fresh.
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
import { PITCH_CARDS } from '@/stores/helpers/pitchCards'
import type {
  BuilderProjectConfig,
  BuilderSheet,
} from '@/stores/helpers/builderCards'
import { useBuilderStore } from '@/stores/builderStore'
import { usePitchStore } from '@/stores/pitchStore'
import { useUserStore } from '@/stores/userStore'

type PitchBuilderType = 'ARTPITCH' | 'DREAM'

const builder = useBuilderStore()
const pitchStore = usePitchStore()
const userStore = useUserStore()

const pitchBuilderKey = 'pitch'

const showResetConfirm = ref(false)
const savedPitchId = ref<number | null>(null)
const isMobile = ref(false)
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

const pitchType = computed<PitchBuilderType>(() => {
  const value = sheetText('PitchType')

  return value === 'DREAM' ? 'DREAM' : 'ARTPITCH'
})

const isSaving = computed(() => {
  return Boolean(builder.isSaving || pitchStore.isSaving)
})

const canSave = computed(() => {
  return Boolean(sheetText('pitch').trim()) && !isSaving.value
})

function defaultPitchSheet(): BuilderSheet {
  const form = pitchStore.pitchForm as Record<string, unknown>

  return {
    PitchType:
      form.PitchType === 'DREAM' || form.PitchType === 'ARTPITCH'
        ? form.PitchType
        : 'ARTPITCH',
    title: typeof form.title === 'string' ? form.title : '',
    pitch: typeof form.pitch === 'string' ? form.pitch : '',
    description:
      typeof form.description === 'string' ? form.description : '',
    artPrompt: typeof form.artPrompt === 'string' ? form.artPrompt : '',
    imagePath: typeof form.imagePath === 'string' ? form.imagePath : null,
    artImageId:
      typeof form.artImageId === 'number' ? form.artImageId : null,
    designer: typeof form.designer === 'string' ? form.designer : null,
    userId:
      typeof form.userId === 'number'
        ? form.userId
        : userStore.userId || userStore.user?.id || 10,
    isPublic: typeof form.isPublic === 'boolean' ? form.isPublic : true,
    isMature: typeof form.isMature === 'boolean' ? form.isMature : false,
  }
}

const pitchBuilderConfig: BuilderProjectConfig = {
  key: pitchBuilderKey,
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
  artDescription:
    'Create, upload, select, or generate art for this pitch.',
  clearFieldDefaults: {
    imagePath: null,
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
}

function updateBreakpoint() {
  if (typeof window === 'undefined') return

  isMobile.value = window.innerWidth < 1024
}

function syncSheetToPitchForm() {
  const resolvedUserId =
    sheetNumber('userId') ?? userStore.userId ?? userStore.user?.id ?? 10

  pitchStore.setPitchForm({
    PitchType: pitchType.value,
    title: sheetText('title'),
    pitch: sheetText('pitch'),
    description: sheetText('description'),
    artPrompt: sheetText('artPrompt'),
    imagePath:
      typeof builder.sheet.imagePath === 'string'
        ? builder.sheet.imagePath
        : undefined,
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

function initializeBuilder() {
  builder.registerBuilder(pitchBuilderConfig)
  builder.setBuilder(pitchBuilderKey, true)

  if (!builder.activeCardKey && builder.visibleCards.length) {
    builder.selectCard('type')
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

function confirmReset() {
  showResetConfirm.value = true
}

function doReset() {
  showResetConfirm.value = false
  savedPitchId.value = null
  pitchStore.startAddingPitch()
  builder.resetBuilder(true)
  builder.selectCard('type')
}

async function doSave() {
  feedback.value = ''
  builder.clearError()
  syncSheetToPitchForm()

  const result = await pitchStore.savePitch()

  if (result.success && result.data?.id) {
    savedPitchId.value = result.data.id
    feedback.value = 'Pitch saved.'
    isError.value = false
    builder.setStatus('Pitch saved.')
  } else {
    feedback.value =
      builder.lastError ?? pitchStore.lastError ?? result.message ?? 'Save failed.'
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
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>