<!-- /components/navigation/workspace-narrator.vue -->
<template>
  <div
    v-if="shouldRender"
    class="pointer-events-none z-100 flex flex-col items-end gap-2"
    :class="narratorFrameClass"
  >
    <Transition name="narrator-bubble">
      <aside
        v-if="activeBubble && bubblesEnabled"
        class="pointer-events-auto max-w-[18rem] rounded-2xl border border-primary/30 bg-base-100/95 p-3 text-sm leading-relaxed text-base-content shadow-2xl backdrop-blur"
      >
        <div class="flex items-start gap-2">
          <span class="text-lg leading-none">
            {{ currentEmotionRow?.emoticon || fallbackEmotionIcon }}
          </span>

          <p class="min-w-0 flex-1 whitespace-pre-wrap">
            {{ activeBubble }}
          </p>

          <button
            type="button"
            class="btn btn-ghost btn-xs btn-circle"
            aria-label="Dismiss narrator message"
            @click="clearBubble"
          >
            <Icon name="kind-icon:close" class="h-3 w-3" />
          </button>
        </div>
      </aside>
    </Transition>

    <Transition name="narrator-panel">
      <section
        v-if="isOpen"
        class="pointer-events-auto w-[min(calc(100vw-1.5rem),28rem)] overflow-hidden rounded-2xl border border-base-300 bg-base-100/95 shadow-2xl backdrop-blur"
      >
        <header
          class="flex items-start justify-between gap-3 border-b border-base-300 bg-base-200/90 p-3"
        >
          <div class="flex min-w-0 gap-3">
            <img
              :src="narratorImage"
              :alt="narratorName"
              class="h-14 w-14 shrink-0 rounded-2xl border border-base-300 bg-base-300 object-cover"
              loading="lazy"
            />

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="truncate font-black text-base-content">
                  {{ narratorName }}
                </h2>

                <span class="badge badge-primary badge-sm rounded-xl">
                  {{ currentEmotionLabel }}
                </span>
              </div>

              <p
                class="mt-1 line-clamp-2 text-xs leading-relaxed text-base-content/60"
              >
                {{ narratorSummary }}
              </p>
            </div>
          </div>

          <div class="flex shrink-0 gap-1">
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle"
              :class="pinOpen ? 'text-primary' : ''"
              :title="pinOpen ? 'Narrator pinned open' : 'Pin narrator open'"
              @click="togglePin"
            >
              <Icon name="kind-icon:pin" class="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle"
              aria-label="Close narrator"
              @click="closePanel"
            >
              <Icon name="kind-icon:close" class="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        <div
          class="max-h-[calc(100dvh-13rem)] overflow-y-auto overscroll-contain p-3"
        >
          <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div class="flex items-start gap-3">
              <Icon
                name="kind-icon:dream"
                class="mt-0.5 h-5 w-5 shrink-0 text-primary"
              />

              <div class="min-w-0">
                <p
                  class="text-xs font-black uppercase tracking-wide text-primary"
                >
                  Active Dream
                </p>

                <h3 class="mt-1 line-clamp-1 font-black text-base-content">
                  {{ activeDream?.title || 'No Dream selected' }}
                </h3>

                <p
                  class="mt-1 line-clamp-3 text-sm leading-relaxed text-base-content/65"
                >
                  {{ activeDreamSummary }}
                </p>
              </div>
            </div>
          </section>

          <section class="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              class="btn btn-secondary btn-sm rounded-2xl"
              :disabled="!activeDream"
              @click="prepareBuildPrompt"
            >
              <Icon name="kind-icon:wand" class="h-4 w-4" />
              Build
            </button>

            <button
              type="button"
              class="btn btn-accent btn-sm rounded-2xl"
              :disabled="!activeDream"
              @click="prepareStoryPrompt"
            >
              <Icon name="kind-icon:book" class="h-4 w-4" />
              Story
            </button>

            <button
              type="button"
              class="btn btn-info btn-sm rounded-2xl"
              @click="cycleEmotion"
            >
              <Icon name="kind-icon:sparkles" class="h-4 w-4" />
              Mood
            </button>
          </section>

          <section
            v-if="emotionOptions.length"
            class="mt-3 rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p
                class="text-xs font-black uppercase tracking-wide text-primary"
              >
                Emotions
              </p>

              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-xl"
                :class="
                  bubblesEnabled ? 'text-success' : 'text-base-content/40'
                "
                @click="toggleBubbles"
              >
                <Icon
                  :name="
                    bubblesEnabled ? 'kind-icon:message' : 'kind-icon:mute'
                  "
                  class="h-3.5 w-3.5"
                />
                Bubbles
              </button>
            </div>

            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="emotion in emotionOptions"
                :key="emotion"
                type="button"
                class="btn btn-xs rounded-xl"
                :class="emotionButtonClass(emotion)"
                @click="setEmotion(emotion)"
              >
                {{ emotionLabel(emotion) }}
              </button>
            </div>
          </section>

          <section
            v-if="narratorSession.length"
            ref="chatLogRef"
            class="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="grid gap-3">
              <article
                v-for="chat in narratorSession"
                :key="chat.id"
                class="grid gap-2"
              >
                <div
                  class="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm leading-relaxed text-primary-content"
                >
                  <p class="whitespace-pre-wrap">{{ chat.content }}</p>
                </div>

                <div class="flex max-w-[90%] gap-2">
                  <img
                    :src="narratorImage"
                    :alt="narratorName"
                    class="h-8 w-8 shrink-0 rounded-full border border-base-300 bg-base-300 object-cover"
                    loading="lazy"
                  />

                  <div
                    class="rounded-2xl rounded-bl-sm bg-base-100 px-3 py-2 text-sm leading-relaxed shadow-sm"
                  >
                    <span
                      v-if="!chat.botResponse"
                      class="flex items-center gap-1 py-1 text-base-content/60"
                    >
                      <span class="narrator-dot" />
                      <span class="narrator-dot delay-150" />
                      <span class="narrator-dot delay-300" />
                    </span>

                    <p v-else class="whitespace-pre-wrap text-base-content/80">
                      {{ chat.botResponse }}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section
            v-if="statusMessage"
            class="mt-3 rounded-2xl border p-3 text-sm"
            :class="
              statusTone === 'error'
                ? 'border-error/40 bg-error/10 text-error'
                : 'border-success/40 bg-success/10 text-success'
            "
          >
            {{ statusMessage }}
          </section>

          <section class="mt-3 grid gap-2">
            <textarea
              v-model="narratorMessage"
              class="textarea textarea-bordered min-h-24 resize-none rounded-2xl bg-base-100 text-sm leading-relaxed"
              :placeholder="narratorPlaceholder"
              :disabled="!canUseNarrator || isNarratorResponding"
              @keydown.ctrl.enter.prevent="sendNarratorMessage"
              @keydown.meta.enter.prevent="sendNarratorMessage"
            />

            <div class="flex flex-wrap justify-between gap-2">
              <button
                type="button"
                class="btn btn-ghost btn-sm rounded-2xl"
                :disabled="isNarratorResponding"
                @click="clearSession"
              >
                Clear
              </button>

              <button
                type="button"
                class="btn btn-primary btn-sm rounded-2xl text-white"
                :disabled="!canSendNarrator"
                @click="sendNarratorMessage"
              >
                <span
                  v-if="isNarratorResponding"
                  class="loading loading-spinner loading-xs"
                />
                <Icon v-else name="kind-icon:send" class="h-4 w-4" />
                Ask Narrator
              </button>
            </div>
          </section>
        </div>
      </section>
    </Transition>

    <section class="pointer-events-auto flex items-end gap-2">
      <Transition name="narrator-actions">
        <div v-if="!isOpen" class="mb-2 hidden flex-col gap-1 sm:flex">
          <button
            type="button"
            class="btn btn-secondary btn-xs rounded-xl shadow-lg"
            :disabled="!activeDream"
            @click="prepareBuildPrompt"
          >
            Build
          </button>

          <button
            type="button"
            class="btn btn-accent btn-xs rounded-xl shadow-lg"
            :disabled="!activeDream"
            @click="prepareStoryPrompt"
          >
            Story
          </button>

          <button
            type="button"
            class="btn btn-info btn-xs rounded-xl shadow-lg"
            @click="cycleEmotion"
          >
            Mood
          </button>
        </div>
      </Transition>

      <button
        type="button"
        class="group relative h-28 w-24 overflow-visible rounded-2xl border border-primary/30 bg-base-100 shadow-2xl transition hover:-translate-y-1 hover:scale-105 sm:h-32 sm:w-28"
        :aria-expanded="isOpen"
        :title="isOpen ? 'Close narrator' : 'Open narrator'"
        @click="togglePanel"
      >
        <div
          class="absolute -inset-1 rounded-2xl bg-primary/20 opacity-0 blur-lg transition group-hover:opacity-100"
        />

        <img
          :src="narratorImage"
          :alt="narratorName"
          class="relative h-full w-full rounded-2xl object-cover"
          loading="lazy"
        />

        <div
          class="absolute inset-x-1 bottom-1 rounded-xl bg-base-100/90 px-2 py-1 text-center shadow backdrop-blur"
        >
          <p
            class="truncate text-[0.65rem] font-black leading-tight text-primary"
          >
            {{ narratorName }}
          </p>

          <p class="truncate text-[0.6rem] leading-tight text-base-content/60">
            {{ currentEmotionLabel }}
          </p>
        </div>

        <span
          v-if="currentEmotionRow?.emoticon"
          class="absolute -right-2 -top-2 rounded-full border border-base-300 bg-base-100 px-2 py-1 text-lg shadow"
        >
          {{ currentEmotionRow.emoticon }}
        </span>
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type {
  ArtImage,
  Bot,
  Chat,
  EmotionImage,
  Server,
} from '~/prisma/generated/prisma/client'
import { useChatStore } from '@/stores/chatStore'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type NarratorEmotion =
  | 'NEUTRAL'
  | 'HAPPY'
  | 'SAD'
  | 'EXCITED'
  | 'NERVOUS'
  | 'ANGRY'
  | 'CONFUSED'
  | 'PROUD'

type BotCafeMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type NarratorEmotionImage = EmotionImage & {
  ArtImage?: Partial<ArtImage> | null
}

type DreamNarratorBot = Partial<Bot> & {
  id: number
  name: string
  EmotionImages?: NarratorEmotionImage[]
}

type DreamWithNarrator = DreamWithRelations & {
  Bots?: DreamNarratorBot[]
}

type NarratorChat = Chat & {
  botResponse?: string | null
}

type ChatRuntimeInput = Parameters<
  ReturnType<typeof useChatStore>['addChat']
>[0]

const dreamStore = useDreamStore()
const navStore = useNavStore()
const chatStore = useChatStore()
const serverStore = useServerStore()
const userStore = useUserStore()
const promptStore = usePromptStore()

const narratorStorageKey = 'kindrobots:workspace-narrator'

const fallbackEmotions: NarratorEmotion[] = [
  'NEUTRAL',
  'HAPPY',
  'EXCITED',
  'CONFUSED',
  'PROUD',
]

const isOpen = ref(false)
const pinOpen = ref(false)
const bubblesEnabled = ref(true)
const currentEmotion = ref<NarratorEmotion>('NEUTRAL')
const activeBubble = ref('')
const narratorMessage = ref('')
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const narratorSessionIds = ref<number[]>([])
const chatLogRef = ref<HTMLElement | null>(null)

let bubbleTimer: ReturnType<typeof setTimeout> | null = null

const isDreamWorkspace = computed(() => {
  return navStore.dashboardShell.dashboardKey === 'dream'
})

const shouldRender = computed(() => {
  return Boolean(isDreamWorkspace.value || dreamStore.selectedDream)
})

const activeDream = computed(() => {
  return (dreamStore.selectedDream as DreamWithNarrator | null) ?? null
})

const dreamNarrators = computed(() => {
  return activeDream.value?.Bots ?? []
})

const narratorBot = computed<DreamNarratorBot | null>(() => {
  return (
    dreamNarrators.value.find(
      (bot) => String(bot.BotType || '').toUpperCase() === 'NARRATOR',
    ) ??
    dreamNarrators.value[0] ??
    null
  )
})

const emotionRows = computed(() => {
  return (narratorBot.value?.EmotionImages ?? []).filter(
    (emotion) => emotion.isActive !== false,
  )
})

const emotionOptions = computed<NarratorEmotion[]>(() => {
  const fromRows = emotionRows.value.map((row) => normalizeEmotion(row.emotion))
  return Array.from(
    new Set<NarratorEmotion>(['NEUTRAL', ...fromRows, ...fallbackEmotions]),
  )
})

const currentEmotionRow = computed(() => {
  const exact = emotionRows.value.find(
    (row) => normalizeEmotion(row.emotion) === currentEmotion.value,
  )

  if (exact) return exact

  return (
    emotionRows.value.find(
      (row) => normalizeEmotion(row.emotion) === 'NEUTRAL',
    ) ??
    emotionRows.value[0] ??
    null
  )
})

const narratorName = computed(() => narratorBot.value?.name || 'Narrator')

const narratorSummary = computed(() => {
  const bot = narratorBot.value

  return (
    bot?.description ||
    bot?.subtitle ||
    bot?.tagline ||
    bot?.personality ||
    'A Dream-facing guide for building elements, starting scenes, and adding flavor.'
  )
})

const narratorImage = computed(() => {
  const emotionImage = readEmotionImage(currentEmotionRow.value)

  return (
    emotionImage ||
    narratorBot.value?.avatarImage ||
    narratorBot.value?.imagePath ||
    dreamImage(activeDream.value) ||
    '/images/bot.webp'
  )
})

const currentEmotionLabel = computed(() => {
  return currentEmotionRow.value?.label || emotionLabel(currentEmotion.value)
})

const fallbackEmotionIcon = computed(() => {
  const lookup: Record<NarratorEmotion, string> = {
    NEUTRAL: '✨',
    HAPPY: '😊',
    SAD: '🌧️',
    EXCITED: '⚡',
    NERVOUS: '🌀',
    ANGRY: '🔥',
    CONFUSED: '❔',
    PROUD: '🌟',
  }

  return lookup[currentEmotion.value] ?? '✨'
})

const activeDreamSummary = computed(() => {
  const dream = activeDream.value

  if (!dream) {
    return 'Choose a Dream from the gallery and I can help turn that vibe into playable pieces.'
  }

  return (
    dream.pitch ||
    dream.description ||
    dream.flavorText ||
    dream.artPrompt ||
    'No Dream summary yet. Deliciously mysterious, mildly inconvenient.'
  )
})

const runtimeTextServer = computed<Server | null>(() => {
  const botServerId = narratorBot.value?.serverId

  if (typeof botServerId === 'number') {
    return (
      serverStore.getServerById(botServerId) ??
      serverStore.activeTextServer ??
      null
    )
  }

  return serverStore.activeTextServer ?? null
})

const narratorSession = computed<NarratorChat[]>(() => {
  return chatStore.chats.filter((chat) =>
    narratorSessionIds.value.includes(chat.id),
  ) as NarratorChat[]
})

const isNarratorResponding = computed(() => {
  return narratorSession.value.some((chat) => !chat.botResponse)
})

const canUseNarrator = computed(() => {
  return Boolean(activeDream.value && narratorBot.value)
})

const canSendNarrator = computed(() => {
  return Boolean(
    canUseNarrator.value &&
    narratorMessage.value.trim() &&
    !isNarratorResponding.value,
  )
})

const narratorPlaceholder = computed(() => {
  if (!activeDream.value) return 'Choose a Dream first.'
  if (!narratorBot.value) return 'Attach a NARRATOR bot to this Dream first.'

  return `Ask ${narratorName.value} about ${activeDream.value.title || 'this Dream'}...`
})

watch(
  () => activeDream.value?.id,
  async () => {
    narratorSessionIds.value = []
    narratorMessage.value = ''
    statusMessage.value = ''
    setEmotion('NEUTRAL', false)

    await nextTick()

    if (bubblesEnabled.value) {
      showBubbleForEmotion('NEUTRAL')
    }
  },
)

watch(
  () => narratorSession.value.map((chat) => chat.botResponse).join(''),
  async () => {
    await nextTick()
    scrollChatToBottom()
  },
)

watch([isOpen, pinOpen, bubblesEnabled], saveSettings)

onMounted(async () => {
  loadSettings()

  await Promise.all([
    dreamStore.initialize({ fetchRemote: true }),
    chatStore.initialize(),
    ...(serverStore.hasLoaded
      ? []
      : [serverStore.initialize({ fetchRemote: true })]),
  ])

  if (bubblesEnabled.value) {
    showBubbleForEmotion(currentEmotion.value)
  }
})

onBeforeUnmount(() => {
  if (bubbleTimer) clearTimeout(bubbleTimer)
})

function normalizeEmotion(value: unknown): NarratorEmotion {
  const normalized = String(value || 'NEUTRAL').toUpperCase()

  if (
    normalized === 'HAPPY' ||
    normalized === 'SAD' ||
    normalized === 'EXCITED' ||
    normalized === 'NERVOUS' ||
    normalized === 'ANGRY' ||
    normalized === 'CONFUSED' ||
    normalized === 'PROUD'
  ) {
    return normalized
  }

  return 'NEUTRAL'
}

function emotionLabel(emotion: NarratorEmotion) {
  return emotion
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function emotionButtonClass(emotion: NarratorEmotion) {
  return currentEmotion.value === emotion
    ? 'btn-primary text-white'
    : 'btn-outline'
}

function setEmotion(emotion: NarratorEmotion, showBubble = true) {
  currentEmotion.value = emotion

  if (showBubble) {
    showBubbleForEmotion(emotion)
  }
}

function cycleEmotion() {
  const options = emotionOptions.value.length
    ? emotionOptions.value
    : fallbackEmotions
  const currentIndex = options.indexOf(currentEmotion.value)
  const nextEmotion = options[(currentIndex + 1) % options.length] ?? 'NEUTRAL'

  setEmotion(nextEmotion)
}

function togglePanel() {
  isOpen.value = !isOpen.value

  if (isOpen.value) {
    showBubbleForEmotion(currentEmotion.value)
  }
}

function closePanel() {
  isOpen.value = false
}

function togglePin() {
  pinOpen.value = !pinOpen.value

  if (pinOpen.value) {
    isOpen.value = true
  }
}

function toggleBubbles() {
  bubblesEnabled.value = !bubblesEnabled.value

  if (!bubblesEnabled.value) {
    clearBubble()
    return
  }

  showBubbleForEmotion(currentEmotion.value)
}

function loadSettings() {
  if (!import.meta.client) return

  try {
    const raw = window.localStorage.getItem(narratorStorageKey)
    if (!raw) return

    const parsed = JSON.parse(raw) as {
      isOpen?: boolean
      pinOpen?: boolean
      bubblesEnabled?: boolean
      currentEmotion?: NarratorEmotion
    }

    pinOpen.value = Boolean(parsed.pinOpen)
    isOpen.value = Boolean(parsed.isOpen || parsed.pinOpen)
    bubblesEnabled.value = parsed.bubblesEnabled !== false
    currentEmotion.value = normalizeEmotion(parsed.currentEmotion)
  } catch {}
}

function saveSettings() {
  if (!import.meta.client) return

  try {
    window.localStorage.setItem(
      narratorStorageKey,
      JSON.stringify({
        isOpen: isOpen.value,
        pinOpen: pinOpen.value,
        bubblesEnabled: bubblesEnabled.value,
        currentEmotion: currentEmotion.value,
      }),
    )
  } catch {}
}

function clearBubble() {
  activeBubble.value = ''

  if (bubbleTimer) {
    clearTimeout(bubbleTimer)
    bubbleTimer = null
  }
}

function showBubbleForEmotion(emotion: NarratorEmotion) {
  if (!bubblesEnabled.value) return

  const row = emotionRows.value.find(
    (entry) => normalizeEmotion(entry.emotion) === emotion,
  )
  const message = pickEmotionPhrase(row)

  if (!message) return

  activeBubble.value = message

  if (bubbleTimer) clearTimeout(bubbleTimer)

  bubbleTimer = setTimeout(() => {
    activeBubble.value = ''
    bubbleTimer = null
  }, 7000)
}

function pickEmotionPhrase(row?: NarratorEmotionImage | null) {
  const phrases = [
    row?.message,
    ...readAdditionalPhrases(row?.additionalPhrases),
  ]
    .filter((phrase): phrase is string => typeof phrase === 'string')
    .map((phrase) => phrase.trim())
    .filter(Boolean)

  const fallback = fallbackPhraseForEmotion(currentEmotion.value)
  const selected = phrases.length
    ? phrases[Math.floor(Math.random() * phrases.length)]
    : fallback

  return applyNarratorTemplate(selected || '')
}

function fallbackPhraseForEmotion(emotion: NarratorEmotion) {
  const dreamTitle = activeDream.value?.title || 'this Dream'

  const phrases: Record<NarratorEmotion, string> = {
    NEUTRAL: `___ is watching ${dreamTitle} take shape.`,
    HAPPY: `___ likes where ${dreamTitle} is going.`,
    SAD: `___ sees a tender shadow inside ${dreamTitle}.`,
    EXCITED: `___ has three extremely suspicious ideas for ${dreamTitle}.`,
    NERVOUS: `___ thinks ${dreamTitle} is powerful, but needs rails.`,
    ANGRY: `___ wants sharper stakes for ${dreamTitle}.`,
    CONFUSED: `___ is untangling the weird little knot inside ${dreamTitle}.`,
    PROUD: `___ thinks ${dreamTitle} has main-character energy.`,
  }

  return phrases[emotion]
}

function applyNarratorTemplate(text: string) {
  const dreamTitle = activeDream.value?.title || 'this Dream'

  return text
    .replace(/___/g, narratorName.value)
    .replace(/\{name\}/g, narratorName.value)
    .replace(/\{bot\}/g, narratorName.value)
    .replace(/\{dream\}/g, dreamTitle)
}

function readAdditionalPhrases(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return []
}

function readEmotionImage(row?: NarratorEmotionImage | null) {
  if (!row) return ''

  return (
    row.imagePath ||
    row.ArtImage?.imagePath ||
    row.ArtImage?.path ||
    row.ArtImage?.fileName ||
    ''
  )
}

function dreamImage(dream?: DreamWithNarrator | null) {
  if (!dream) return ''

  const artImage = dream.ArtImage
  const collectionImage = dream.ArtCollection?.ArtImages?.[0]

  return (
    dream.imagePath ||
    dream.highlightImage ||
    artImage?.imagePath ||
    artImage?.path ||
    artImage?.fileName ||
    collectionImage?.imagePath ||
    collectionImage?.path ||
    collectionImage?.fileName ||
    ''
  )
}

function prepareBuildPrompt() {
  if (!activeDream.value) return

  navStore.setDashboardTab('dream', 'dreammaker', 'workspace narrator build')
  isOpen.value = true
  setEmotion('EXCITED')

  narratorMessage.value = [
    `Help me expand the Dream "${activeDream.value.title}".`,
    'Suggest one character, one scenario/location, one related Dream, and one art direction.',
    'Keep it punchy and immediately usable.',
  ].join('\n')
}

function prepareStoryPrompt() {
  if (!activeDream.value) return

  navStore.setDashboardTab('dream', 'interact', 'workspace narrator story')
  isOpen.value = true
  setEmotion('PROUD')

  narratorMessage.value = [
    `Start an interactive opening scene for the Dream "${activeDream.value.title}".`,
    'Use the connected characters and scenarios if they exist.',
    'End with 2 or 3 choices for the user.',
  ].join('\n')
}

function buildNarratorSystemPrompt() {
  const dream = activeDream.value
  const bot = narratorBot.value

  return [
    bot?.prompt ||
      'You are the workspace Narrator, a focused assistant for building and playing Dream experiences.',
    bot?.personality ? `Personality: ${bot.personality}` : '',
    bot?.narrativeVoice ? `Narrative voice: ${bot.narrativeVoice}` : '',
    bot?.forgeIntro ? `Forge guidance: ${bot.forgeIntro}` : '',
    bot?.botIntro ? `Bot intro: ${bot.botIntro}` : '',
    dream
      ? [
          `Active Dream: ${dream.title}`,
          dream.dreamType ? `Dream type: ${dream.dreamType}` : '',
          dream.pitch || dream.description || dream.flavorText || '',
          dream.Scenarios?.length
            ? `Scenarios: ${dream.Scenarios.map((scenario) => scenario.title)
                .filter(Boolean)
                .join(', ')}`
            : '',
          dream.Characters?.length
            ? `Characters: ${dream.Characters.map((character) => character.name)
                .filter(Boolean)
                .join(', ')}`
            : '',
          dream.Rewards?.length
            ? `Rewards: ${dream.Rewards.map((reward) => reward.name)
                .filter(Boolean)
                .join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n')
      : '',
    'Help build more elements, start stories, and add vivid flavor. Stay scoped to the active Dream. Do not act like a public chatroom.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function buildNarratorMessages(nextUserMessage: string): BotCafeMessage[] {
  const previousMessages = narratorSession.value.flatMap((chat) => {
    const messages: BotCafeMessage[] = [
      {
        role: 'user',
        content: chat.content,
      },
    ]

    if (chat.botResponse) {
      messages.push({
        role: 'assistant',
        content: chat.botResponse,
      })
    }

    return messages
  })

  return [
    {
      role: 'system',
      content: buildNarratorSystemPrompt(),
    },
    ...previousMessages,
    {
      role: 'user',
      content: nextUserMessage,
    },
  ]
}

const narratorFrameClass = computed(() => {
  if (props.railMode && !props.chromeMinimized) {
    return 'relative max-w-[min(28rem,42vw)]'
  }

  return 'fixed bottom-3 right-3 max-w-[calc(100vw-1.5rem)] sm:bottom-4 sm:right-4'
})

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

function clearSession() {
  narratorSessionIds.value = []
  narratorMessage.value = ''
  statusMessage.value = ''
}

function scrollChatToBottom() {
  const element = chatLogRef.value
  if (!element) return

  element.scrollTop = element.scrollHeight
}

async function sendNarratorMessage() {
  const dream = activeDream.value
  const bot = narratorBot.value
  const content = narratorMessage.value.trim()

  if (!dream || !bot || !content || isNarratorResponding.value) return

  statusMessage.value = ''
  promptStore.currentPrompt = content
  setEmotion('EXCITED', false)

  try {
    const server = runtimeTextServer.value
    const userId = userStore.userId ?? userStore.user?.id ?? 10

    const payload: ChatRuntimeInput = {
      botId: bot.id,
      botName: bot.name,
      dreamId: dream.id,
      content,
      isPublic: false,
      userId,
      type: 'ToBot',
      recipientId: bot.id,
      characterId: null,
      serverId: server?.id ?? null,
      serverName: server?.title ?? server?.label ?? null,
    } as ChatRuntimeInput

    const messages = buildNarratorMessages(content)
    const newChat = await chatStore.addChat(payload)

    narratorSessionIds.value.push(newChat.id)
    narratorMessage.value = ''

    await nextTick()
    scrollChatToBottom()

    await chatStore.streamResponse(newChat.id, {
      model: server?.model || 'gpt-4o-mini',
      temperature: 0.82,
      maxTokens: 1400,
      serverId: server?.id ?? null,
      serverName: server?.title ?? server?.label ?? null,
      serverSelectionMode: server ? 'specific' : 'default',
      messages,
      stream: true,
    })

    setEmotion('HAPPY')
    await nextTick()
    scrollChatToBottom()
  } catch (error) {
    setEmotion('CONFUSED')
    setStatus(
      error instanceof Error
        ? error.message
        : 'Narrator request failed. Check Dream narrator bot and text server settings.',
      'error',
    )
  }
}

const props = withDefaults(
  defineProps<{
    chromeMinimized?: boolean
    railMode?: boolean
  }>(),
  {
    chromeMinimized: false,
    railMode: false,
  },
)
</script>

<style scoped>
.narrator-dot {
  display: inline-block;
  height: 0.375rem;
  width: 0.375rem;
  border-radius: 9999px;
  background: currentColor;
  animation: narrator-bounce 1s ease-in-out infinite;
}

.delay-150 {
  animation-delay: 150ms;
}

.delay-300 {
  animation-delay: 300ms;
}

.narrator-panel-enter-active,
.narrator-panel-leave-active,
.narrator-bubble-enter-active,
.narrator-bubble-leave-active,
.narrator-actions-enter-active,
.narrator-actions-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.narrator-panel-enter-from,
.narrator-panel-leave-to {
  opacity: 0;
  transform: translateY(1rem) scale(0.98);
}

.narrator-bubble-enter-from,
.narrator-bubble-leave-to {
  opacity: 0;
  transform: translateY(0.5rem) scale(0.98);
}

.narrator-actions-enter-from,
.narrator-actions-leave-to {
  opacity: 0;
  transform: translateX(0.5rem);
}

@keyframes narrator-bounce {
  0%,
  80%,
  100% {
    opacity: 0.4;
    transform: scale(0.65);
  }

  40% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
