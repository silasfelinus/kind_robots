<!-- /components/bots/bot-builder.vue -->
<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden">
    <header
      class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100/80 px-4 py-2.5 backdrop-blur-sm"
    >
      <div class="flex items-center gap-2.5">
        <Icon name="kind-icon:robot" class="h-5 w-5 text-primary" />

        <h1 class="text-lg font-black tracking-tight">Bot Builder</h1>

        <span
          v-if="botType"
          class="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary capitalize"
        >
          {{ botType }}
        </span>

        <span
          v-if="underConstruction"
          class="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-xs font-bold text-warning"
        >
          under construction
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
        <bot-sheet />
      </aside>

      <main class="flex flex-1 flex-col overflow-hidden">
        <bot-stage class="flex-1 overflow-y-auto" />
      </main>
    </div>

    <bot-hand
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
          <p class="mb-1 text-lg font-black">Reset bot?</p>

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
import { BOT_CARDS } from '@/stores/helpers/botCards'
import type {
  BuilderProjectConfig,
  BuilderSheet,
} from '@/stores/helpers/builderCards'
import { useBotStore } from '@/stores/botStore'
import { useBuilderStore } from '@/stores/builderStore'
import { useUserStore } from '@/stores/userStore'

const builder = useBuilderStore()
const botStore = useBotStore()
const userStore = useUserStore()

const isMobile = ref(false)
const showResetConfirm = ref(false)
const feedback = ref('')
const isError = ref(false)

const botBuilderKey = 'bot'

function sheetText(key: string): string {
  const value = builder.sheet[key]

  return typeof value === 'string' ? value : ''
}

function sheetBoolean(key: string): boolean {
  return builder.sheet[key] === true
}

const botType = computed(() => sheetText('BotType'))
const underConstruction = computed(() => sheetBoolean('underConstruction'))

const isSaving = computed(() => {
  return Boolean(builder.isSaving || botStore.isSaving)
})

const canSave = computed(() => {
  return (
    Boolean(sheetText('name').trim()) &&
    Boolean(sheetText('prompt').trim()) &&
    !isSaving.value
  )
})

function defaultBotSheet(): BuilderSheet {
  const form = botStore.botForm as Record<string, unknown>

  return {
    BotType: typeof form.BotType === 'string' ? form.BotType : 'assistant',
    name: typeof form.name === 'string' ? form.name : '',
    subtitle: typeof form.subtitle === 'string' ? form.subtitle : '',
    description: typeof form.description === 'string' ? form.description : '',
    avatarImage:
      typeof form.avatarImage === 'string' ? form.avatarImage : '',
    botIntro: typeof form.botIntro === 'string' ? form.botIntro : '',
    userIntro: typeof form.userIntro === 'string' ? form.userIntro : '',
    prompt: typeof form.prompt === 'string' ? form.prompt : '',
    trainingPath:
      typeof form.trainingPath === 'string' ? form.trainingPath : '',
    theme: typeof form.theme === 'string' ? form.theme : '',
    personality:
      typeof form.personality === 'string' ? form.personality : '',
    modules: typeof form.modules === 'string' ? form.modules : '',
    sampleResponse:
      typeof form.sampleResponse === 'string' ? form.sampleResponse : '',
    tagline: typeof form.tagline === 'string' ? form.tagline : '',
    artPrompt: typeof form.artPrompt === 'string' ? form.artPrompt : '',
    imagePath: typeof form.imagePath === 'string' ? form.imagePath : null,
    artImageId:
      typeof form.artImageId === 'number' ? form.artImageId : null,
    userId:
      typeof form.userId === 'number'
        ? form.userId
        : userStore.userId || userStore.user?.id || 10,
    isPublic: typeof form.isPublic === 'boolean' ? form.isPublic : true,
    underConstruction:
      typeof form.underConstruction === 'boolean'
        ? form.underConstruction
        : false,
    canDelete: typeof form.canDelete === 'boolean' ? form.canDelete : true,
  }
}

const botBuilderConfig: BuilderProjectConfig = {
  key: botBuilderKey,
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
    imagePath: null,
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
}

function updateBreakpoint() {
  if (typeof window === 'undefined') return

  isMobile.value = window.innerWidth < 1024
}

function syncSheetToBotForm() {
  botStore.setBotForm({
    BotType: sheetText('BotType'),
    name: sheetText('name'),
    subtitle: sheetText('subtitle'),
    description: sheetText('description'),
    avatarImage: sheetText('avatarImage'),
    botIntro: sheetText('botIntro'),
    userIntro: sheetText('userIntro'),
    prompt: sheetText('prompt'),
    trainingPath: sheetText('trainingPath'),
    theme: sheetText('theme'),
    personality: sheetText('personality'),
    modules: sheetText('modules'),
    sampleResponse: sheetText('sampleResponse'),
    tagline: sheetText('tagline'),
    artPrompt: sheetText('artPrompt'),
    imagePath:
      typeof builder.sheet.imagePath === 'string'
        ? builder.sheet.imagePath
        : undefined,
    artImageId:
      typeof builder.sheet.artImageId === 'number'
        ? builder.sheet.artImageId
        : undefined,
    userId:
      typeof builder.sheet.userId === 'number'
        ? builder.sheet.userId
        : userStore.userId || userStore.user?.id || 10,
    isPublic:
      typeof builder.sheet.isPublic === 'boolean'
        ? builder.sheet.isPublic
        : true,
    underConstruction:
      typeof builder.sheet.underConstruction === 'boolean'
        ? builder.sheet.underConstruction
        : false,
    canDelete:
      typeof builder.sheet.canDelete === 'boolean'
        ? builder.sheet.canDelete
        : true,
  })
}

function initializeBuilder() {
  builder.registerBuilder(botBuilderConfig)
  builder.setBuilder(botBuilderKey, true)

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

function doReset() {
  showResetConfirm.value = false
  botStore.startAddingBot()
  builder.resetBuilder(true)
  builder.selectCard('type')
}

async function doSave() {
  feedback.value = ''
  builder.clearError()
  syncSheetToBotForm()

  const result = await botStore.saveBot()

  if (result.success && result.data) {
    feedback.value = 'Bot saved.'
    isError.value = false
    builder.setStatus('Bot saved.')
  } else {
    feedback.value =
      builder.lastError ?? botStore.lastError ?? result.message ?? 'Save failed.'
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