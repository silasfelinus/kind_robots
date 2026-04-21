<!-- /components/content/story/kind-loader.vue -->
<template>
  <div>
    <butterfly-layer class="z-50" />

    <div
      v-if="showOverlay"
      class="loading-overlay"
      :class="{ 'fade-out': fadeOut }"
      @transitionend="handleTransitionEnd"
    >
      <Icon
        name="kind-icon:bubble-loading"
        class="bubble-loader"
        :style="frozenIconStyle"
      />
      <div class="loading-message" :style="frozenMessageStyle">
        {{ currentMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/kind-loader.vue
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useErrorStore, ErrorType } from '../../stores/errorStore'
import { useUserStore } from '../../stores/userStore'
import { useArtStore } from '../../stores/artStore'
import { useRandomStore } from '../../stores/randomStore'
import { useCharacterStore } from '../../stores/characterStore'
import { useBotStore } from '../../stores/botStore'
import { useChatStore } from '../../stores/chatStore'
import { useMilestoneStore } from '../../stores/milestoneStore'
import { useDisplayStore } from '../../stores/displayStore'
import { usePitchStore } from '../../stores/pitchStore'
import { usePromptStore } from '../../stores/promptStore'
import { useReactionStore } from '../../stores/reactionStore'
import { useRewardStore } from '../../stores/rewardStore'
import { useGalleryStore } from '../../stores/galleryStore'
import { useScenarioStore } from '../../stores/scenarioStore'
import { useWeirdStore } from '../../stores/weirdStore'
import { useConsoleStore } from '../../stores/consoleStore'
import { useChoiceStore } from '../../stores/choiceStore'
import { useSmartbarStore } from '../../stores/smartbarStore'
import { useComponentStore } from '../../stores/componentStore'
import { usePageStore } from '../../stores/pageStore'
import { useNavStore } from '../../stores/navStore'
import { useLoadStore } from '../../stores/loadStore'

const errorStore = useErrorStore()
const displayStore = useDisplayStore()
const pageStore = usePageStore()
const userStore = useUserStore()
const artStore = useArtStore()
const botStore = useBotStore()
const milestoneStore = useMilestoneStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()
const reactionStore = useReactionStore()
const rewardStore = useRewardStore()
const chatStore = useChatStore()
const characterStore = useCharacterStore()
const galleryStore = useGalleryStore()
const scenarioStore = useScenarioStore()
const weirdStore = useWeirdStore()
const consoleStore = useConsoleStore()
const choiceStore = useChoiceStore()
const smartbarStore = useSmartbarStore()
const componentStore = useComponentStore()
const randomStore = useRandomStore()
const navStore = useNavStore()
const loadStore = useLoadStore()

const emit = defineEmits<{
  pageReady: [boolean]
}>()

const isReady = ref(false)
const showOverlay = ref(true)
const fadeOut = ref(false)
const currentMessage = ref('Building Kind Robots...')

const frozenIconStyle = ref<Record<string, string>>({})
const frozenMessageStyle = ref<Record<string, string>>({})

let messageIntervalId: ReturnType<typeof setInterval> | null = null
let initialMessageTimeoutId: ReturnType<typeof setTimeout> | null = null
let fadeTimeoutId: ReturnType<typeof setTimeout> | null = null

function updateMessage() {
  currentMessage.value =
    loadStore.randomLoadMessage?.() ?? 'Building Kind Robots...'
}

function startFadeOut() {
  fadeOut.value = true
}

function handleTransitionEnd(event: TransitionEvent) {
  if (event.propertyName !== 'opacity') return
  if (!fadeOut.value) return

  showOverlay.value = false

  if (!isReady.value) {
    isReady.value = true
    emit('pageReady', true)
  }
}

onMounted(async () => {
  // Capture CSS variable values synchronously before any async store inits
  // can trigger a theme change and alter the palette
  const cs = getComputedStyle(document.documentElement)
  const p = cs.getPropertyValue('--p').trim()
  const b1 = cs.getPropertyValue('--b1').trim()
  const bc = cs.getPropertyValue('--bc').trim()

  frozenIconStyle.value = {
    color: `oklch(${p})`,
    filter: `drop-shadow(0 0 1rem oklch(${p} / 0.35))`,
  }
  frozenMessageStyle.value = {
    borderColor: `oklch(${bc} / 0.2)`,
    background: `oklch(${b1} / 0.92)`,
    color: `oklch(${bc})`,
  }

  try {
    if (!displayStore.isInitialized) {
      await errorStore.handleError(
        async () => displayStore.initialize(),
        ErrorType.STORE_ERROR,
        'Error initializing display store',
      )
    }

    initialMessageTimeoutId = setTimeout(() => {
      updateMessage()
      messageIntervalId = setInterval(updateMessage, 2500)
    }, 100)

    await Promise.all([
      userStore.initialize?.(),
      pageStore.initialize?.(),
      navStore.initialize?.(),
      smartbarStore.initialize?.(),
      consoleStore.initialize?.(),
      milestoneStore.initialize?.(),
    ])

    await Promise.all([
      artStore.initialize?.(),
      botStore.initialize?.(),
      galleryStore.initialize?.(),
      chatStore.initialize?.(),
    ])

    console.log('All stores initialized successfully.')

    fadeTimeoutId = setTimeout(() => {
      startFadeOut()
    }, 1300)
  } catch (error) {
    console.error('Initialization failed:', error)
    errorStore.setError(
      ErrorType.UNKNOWN_ERROR,
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    )
    fadeTimeoutId = setTimeout(() => {
      startFadeOut()
    }, 1300)
  }
})

onBeforeUnmount(() => {
  if (initialMessageTimeoutId) {
    clearTimeout(initialMessageTimeoutId)
    initialMessageTimeoutId = null
  }

  if (fadeTimeoutId) {
    clearTimeout(fadeTimeoutId)
    fadeTimeoutId = null
  }

  if (messageIntervalId) {
    clearInterval(messageIntervalId)
    messageIntervalId = null
  }

  displayStore.removeViewportWatcher()
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  background: color-mix(in oklab, black 100%, transparent);
  transition: opacity 1s;
  pointer-events: auto;
}

.loading-overlay.fade-out {
  opacity: 0;
  pointer-events: none;
}

.loading-message {
  max-width: min(90vw, 42rem);
  padding: 0.75rem 1.25rem;
  border-radius: 1rem;
  border: 1px solid;
  font-size: clamp(1.125rem, 2vw, 2rem);
  font-weight: 700;
  text-align: center;
  box-shadow: 0 0.75rem 2rem oklch(0 0 0 / 0.18);
  backdrop-filter: blur(10px);
}

.bubble-loader {
  font-size: clamp(4rem, 10vw, 6rem);
}
</style>
