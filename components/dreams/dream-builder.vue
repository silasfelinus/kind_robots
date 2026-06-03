<!-- /components/dreams/dream-builder.vue -->
<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden">
    <header
      class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100/80 px-4 py-2.5 backdrop-blur-sm"
    >
      <div class="flex items-center gap-2.5">
        <Icon name="kind-icon:moon" class="h-5 w-5 text-primary" />

        <h1 class="text-lg font-black tracking-tight">Dream Builder</h1>

        <span
          v-if="vibeTag"
          class="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary capitalize"
        >
          {{ vibeTag }}
        </span>

        <span
          v-if="accessMode && accessMode !== 'OPEN'"
          class="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-xs font-bold text-warning"
        >
          {{ accessMode === 'CODE' ? '🔑 code' : '🔒 private' }}
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
        <dream-sheet />
      </aside>

      <main class="flex flex-1 flex-col overflow-hidden">
        <dream-stage class="flex-1 overflow-y-auto" />
      </main>
    </div>

    <dream-hand
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
          <p class="mb-1 text-lg font-black">Reset dream?</p>

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

const dreamBuilderKey = 'dream'

const isMobile = ref(false)
const showResetConfirm = ref(false)
const feedback = ref('')
const isError = ref(false)
const savedDreamId = ref<number | null>(null)

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

const vibeTag = computed(() => sheetText('vibeTag'))

const accessMode = computed<DreamAccessMode>(() => {
  const value = sheetText('accessMode')

  if (value === 'PRIVATE' || value === 'CODE') return value

  return 'OPEN'
})

const isSaving = computed(() => {
  return Boolean(builder.isSaving || dreamStore.isSaving)
})

const canSave = computed(() => {
  return Boolean(sheetText('title').trim()) && !isSaving.value
})

function defaultDreamSheet(): BuilderSheet {
  const form = dreamStore.dreamForm as Record<string, unknown>

  return {
    vibeTag: '',
    title: typeof form.title === 'string' ? form.title : '',
    description:
      typeof form.description === 'string' ? form.description : '',
    currentVibe:
      typeof form.currentVibe === 'string' ? form.currentVibe : '',
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

const dreamBuilderConfig: BuilderProjectConfig = {
  key: dreamBuilderKey,
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
}

function updateBreakpoint() {
  if (typeof window === 'undefined') return

  isMobile.value = window.innerWidth < 1024
}

function syncSheetToDreamForm() {
  const mode = accessMode.value

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
    userId:
      sheetNumber('userId') ?? userStore.userId || userStore.user?.id || 10,
    isPublic: sheetBoolean('isPublic', true),
    isMature: sheetBoolean('isMature', false),
  })
}

function initializeBuilder() {
  builder.registerBuilder(dreamBuilderConfig)
  builder.setBuilder(dreamBuilderKey, true)

  if (!builder.activeCardKey && builder.visibleCards.length) {
    builder.selectCard('atmosphere')
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
  savedDreamId.value = null
  dreamStore.startAddingDream()
  builder.resetBuilder(true)
  builder.selectCard('atmosphere')
}

async function doSave() {
  feedback.value = ''
  builder.clearError()
  syncSheetToDreamForm()

  const result = await dreamStore.saveDream()

  if (result.success && result.data) {
    if (result.data.id) savedDreamId.value = result.data.id

    feedback.value = 'Dream saved.'
    isError.value = false
    builder.setStatus('Dream saved.')
  } else {
    feedback.value =
      builder.lastError ?? dreamStore.error ?? result.message ?? 'Save failed.'
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