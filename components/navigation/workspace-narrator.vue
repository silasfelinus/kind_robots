<!-- /components/workspace/workspace-narrator.vue -->
<template>
  <div
    v-if="narratorDockVisible"
    class="pointer-events-none absolute inset-y-0 right-0 h-full w-full overflow-visible"
  >
    <Transition name="narrator-panel">
      <section
        v-if="isOpen"
        class="pointer-events-auto absolute inset-y-0 right-0 z-40 flex h-full w-full max-w-[100vw] min-w-0 flex-col overflow-hidden rounded-2xl border border-primary/25 bg-base-100/95 shadow-2xl backdrop-blur-xl sm:rounded-3xl"
      >
        <div class="narrator-card-stage relative h-full min-h-0 w-full">
          <div
            class="narrator-card-shell h-full min-h-0 w-full"
            :class="chatFaceOpen ? 'is-chat-face' : ''"
          >
            <section
              class="narrator-face narrator-face-front flex h-full min-h-0 w-full flex-col overflow-hidden"
            >
              <header
                class="relative shrink-0 overflow-hidden border-b border-base-300 bg-base-200/90 p-3"
              >
                <div
                  class="absolute -right-12 -top-16 h-36 w-36 rounded-full bg-primary/20 blur-3xl"
                />
                <div
                  class="absolute -bottom-20 left-8 h-32 w-32 rounded-full bg-secondary/20 blur-3xl"
                />

                <div class="relative flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p
                      class="truncate text-xs font-black uppercase tracking-widest text-primary"
                    >
                      Narrator Remote
                    </p>

                    <p
                      class="mt-1 line-clamp-1 text-xs leading-relaxed text-base-content/60"
                    >
                      Tap the name or mood to flip into chat.
                    </p>
                  </div>

                  <div class="flex shrink-0 gap-1">
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs btn-circle"
                      :class="pinOpen ? 'text-primary' : ''"
                      :title="
                        pinOpen ? 'Narrator pinned open' : 'Pin narrator open'
                      "
                      @click="togglePin"
                    >
                      <Icon name="kind-icon:pin" class="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      class="btn btn-ghost btn-xs btn-circle"
                      aria-label="Close narrator"
                      @click="closeNarrator"
                    >
                      <Icon name="kind-icon:close" class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </header>

              <main class="flex min-h-0 flex-1 flex-col bg-base-200/35 p-3">
                <button
                  type="button"
                  class="group relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[2rem] border border-primary/20 bg-base-100/70 shadow-inner"
                  :aria-label="`Shift ${narratorName} expression`"
                  @click="playReactionOnClick"
                >
                  <div
                    class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-80"
                  />

                  <div
                    class="magic-card relative z-10 flex h-full w-full items-center justify-center"
                    :class="expressionTricking ? 'is-tricking' : ''"
                  >
                    <div
                      v-if="showExpressionBack"
                      class="expression-card-back absolute inset-2 rounded-[1.75rem]"
                      aria-hidden="true"
                    >
                      <div class="expression-card-back-core">
                        <Icon
                          name="kind-icon:dream"
                          class="h-12 w-12 text-primary/70"
                        />
                      </div>
                    </div>

                    <img
                      v-else
                      :src="displayedNarratorImage"
                      :alt="narratorName"
                      class="h-full w-full rounded-[1.75rem] object-contain p-2 transition-transform duration-300 group-hover:scale-[1.015]"
                      loading="lazy"
                    />
                  </div>

                  <div class="pointer-events-none absolute inset-0">
                    <span
                      v-for="burst in emojiBursts"
                      :key="burst.id"
                      class="emoji-burst"
                      :style="{
                        left: `${burst.x}%`,
                        top: `${burst.y}%`,
                        animationDelay: `${burst.delay}ms`,
                      }"
                    >
                      {{ burst.emoji }}
                    </span>
                  </div>
                </button>

                <Transition name="narrator-musing">
                  <article
                    v-if="latestMusing"
                    class="mt-3 rounded-3xl border border-primary/20 bg-base-100 px-3 py-2 shadow-lg"
                  >
                    <div class="flex items-start gap-2">
                      <span
                        v-if="latestMusing.emoticon"
                        class="mt-0.5 text-lg leading-none"
                        aria-hidden="true"
                      >
                        {{ latestMusing.emoticon }}
                      </span>

                      <div class="min-w-0 flex-1">
                        <p
                          class="text-[0.65rem] font-black uppercase tracking-wide text-primary/70"
                        >
                          {{ latestMusing.label }}
                        </p>

                        <p
                          class="mt-1 line-clamp-3 text-sm leading-relaxed text-base-content/80"
                        >
                          {{ latestMusing.message }}
                        </p>
                      </div>
                    </div>
                  </article>
                </Transition>

                <button
                  type="button"
                  class="mt-3 rounded-3xl border border-primary/20 bg-base-100 p-3 text-left shadow-lg transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl"
                  aria-label="Flip narrator card to chat"
                  @click="openChatFace"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <h2
                        class="truncate text-lg font-black leading-tight text-base-content"
                      >
                        {{ narratorName }}
                      </h2>

                      <p
                        class="mt-1 truncate text-xs font-black uppercase tracking-widest text-primary/75"
                      >
                        {{ currentEmotionLabel }}
                      </p>
                    </div>

                    <div class="flex shrink-0 items-center gap-2">
                      <span
                        v-if="currentEmotionRow?.emoticon"
                        class="rounded-2xl border border-base-300 bg-base-200 px-2 py-1 text-lg shadow-sm"
                      >
                        {{ currentEmotionRow.emoticon }}
                      </span>

                      <Icon
                        name="kind-icon:rotate"
                        class="h-5 w-5 text-primary"
                      />
                    </div>
                  </div>
                </button>
              </main>
            </section>

            <section
              class="narrator-face narrator-face-back flex h-full min-h-0 w-full flex-col overflow-hidden"
            >
              <header
                class="relative shrink-0 overflow-hidden border-b border-base-300 bg-base-200/90 p-3"
              >
                <div
                  class="absolute -right-12 -top-16 h-36 w-36 rounded-full bg-primary/20 blur-3xl"
                />

                <div class="relative flex items-center justify-between gap-3">
                  <button
                    type="button"
                    class="group flex min-w-0 items-center gap-3 text-left"
                    @click="closeChatFace"
                  >
                    <div
                      class="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-primary/30 bg-base-300 shadow"
                    >
                      <div
                        class="magic-card h-full w-full"
                        :class="expressionTricking ? 'is-tricking' : ''"
                      >
                        <div
                          v-if="showExpressionBack"
                          class="expression-card-back absolute inset-1 rounded-xl"
                          aria-hidden="true"
                        />

                        <img
                          v-else
                          :src="displayedNarratorImage"
                          :alt="narratorName"
                          class="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    <div class="min-w-0">
                      <p
                        class="truncate text-sm font-black leading-tight text-base-content"
                      >
                        {{ narratorName }}
                      </p>

                      <p
                        class="truncate text-[0.65rem] font-black uppercase tracking-widest text-primary/75"
                      >
                        {{ currentEmotionLabel }}
                      </p>
                    </div>
                  </button>

                  <div class="flex shrink-0 gap-1">
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs btn-circle"
                      :class="showTopics ? 'text-primary' : ''"
                      aria-label="Toggle narrator topics"
                      @click="showTopics = !showTopics"
                    >
                      <Icon name="kind-icon:map" class="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      class="btn btn-ghost btn-xs btn-circle"
                      aria-label="Return to narrator portrait"
                      @click="closeChatFace"
                    >
                      <Icon name="kind-icon:close" class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </header>

              <Transition name="narrator-topics">
                <section
                  v-if="showTopics"
                  class="shrink-0 border-b border-base-300 bg-base-200/55 p-3"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p
                      class="text-xs font-black uppercase tracking-wide text-primary"
                    >
                      Topics & Threads
                    </p>

                    <span class="badge badge-outline badge-sm rounded-xl">
                      {{ topicButtons.length }}
                    </span>
                  </div>

                  <div class="mt-2 grid max-h-72 gap-2 overflow-y-auto pr-1">
                    <button
                      v-for="topic in topicButtons"
                      :key="topic.key"
                      type="button"
                      class="group flex items-center gap-3 rounded-2xl border bg-base-100 p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                      :class="
                        selectedTopicKey === topic.key
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-base-300'
                      "
                      @click="selectTopic(topic)"
                    >
                      <span
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"
                      >
                        <Icon :name="topic.icon" class="h-4 w-4" />
                      </span>

                      <span class="min-w-0 flex-1">
                        <span
                          class="block truncate text-sm font-black text-base-content"
                        >
                          {{ topic.title }}
                        </span>

                        <span
                          class="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-base-content/60"
                        >
                          {{ topic.description }}
                        </span>
                      </span>

                      <Icon
                        v-if="topic.route"
                        name="kind-icon:chevron-right"
                        class="h-4 w-4 shrink-0 text-primary/60"
                      />
                    </button>
                  </div>
                </section>
              </Transition>

              <div
                ref="chatLogRef"
                class="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-base-200/35 p-3"
              >
                <div class="grid gap-3">
                  <article
                    v-if="selectedTopicIntro"
                    class="rounded-3xl border border-primary/20 bg-primary/5 p-3"
                  >
                    <div class="flex items-start gap-3">
                      <Icon
                        :name="selectedTopicIcon"
                        class="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      />

                      <div class="min-w-0 flex-1">
                        <p
                          class="text-xs font-black uppercase tracking-wide text-primary"
                        >
                          {{ selectedTopicTitle }}
                        </p>

                        <p
                          class="mt-1 text-sm leading-relaxed text-base-content/75"
                        >
                          {{ selectedTopicIntro }}
                        </p>
                      </div>
                    </div>
                  </article>

                  <article
                    v-if="!narratorSession.length"
                    class="flex items-start gap-2"
                  >
                    <img
                      :src="displayedNarratorImage"
                      :alt="narratorName"
                      class="h-8 w-8 shrink-0 rounded-full border border-base-300 bg-base-300 object-cover shadow-sm"
                      loading="lazy"
                    />

                    <div
                      class="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-base-100 px-3 py-2 text-sm leading-relaxed text-base-content/85 shadow-sm"
                    >
                      {{ narratorIntro }}
                    </div>
                  </article>

                  <article
                    v-for="chat in narratorSession"
                    :key="chat.id"
                    class="grid gap-2"
                  >
                    <div
                      class="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm leading-relaxed text-primary-content"
                    >
                      <p class="whitespace-pre-wrap">
                        {{ chat.content }}
                      </p>
                    </div>

                    <div class="flex max-w-[90%] gap-2">
                      <img
                        :src="displayedNarratorImage"
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

                        <p
                          v-else
                          class="whitespace-pre-wrap text-base-content/80"
                        >
                          {{ chat.botResponse }}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>
              </div>

              <footer
                class="shrink-0 border-t border-base-300 bg-base-100 p-3"
              >
                <section
                  v-if="statusMessage"
                  class="mb-2 rounded-2xl border p-2 text-sm"
                  :class="
                    statusTone === 'error'
                      ? 'border-error/40 bg-error/10 text-error'
                      : 'border-success/40 bg-success/10 text-success'
                  "
                >
                  {{ statusMessage }}
                </section>

                <textarea
                  v-model="narratorMessage"
                  class="textarea textarea-bordered min-h-20 resize-none rounded-2xl bg-base-100 text-sm leading-relaxed"
                  :placeholder="narratorPlaceholder"
                  :disabled="!canUseNarrator || isNarratorResponding"
                  @keydown.ctrl.enter.prevent="sendNarratorMessage"
                  @keydown.meta.enter.prevent="sendNarratorMessage"
                />

                <div class="mt-2 flex flex-wrap justify-between gap-2">
                  <div class="flex flex-wrap gap-2">
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
                      class="btn btn-secondary btn-sm rounded-2xl"
                      @click="showTopics = !showTopics"
                    >
                      <Icon name="kind-icon:map" class="h-4 w-4" />
                      Topics
                    </button>
                  </div>

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
                    Ask
                  </button>
                </div>
              </footer>
            </section>
          </div>
        </div>
      </section>
    </Transition>

    <div
      v-if="!isOpen"
      class="pointer-events-auto absolute bottom-3 right-3 z-50 flex flex-col items-end gap-2"
    >
      <Transition name="narrator-musing">
        <article
          v-if="latestMusing"
          class="max-w-[min(18rem,calc(100vw-7rem))] rounded-3xl border border-primary/20 bg-base-100/95 px-3 py-2 text-sm shadow-2xl backdrop-blur"
        >
          <div class="flex items-start gap-2">
            <span
              v-if="latestMusing.emoticon"
              class="mt-0.5 text-lg leading-none"
              aria-hidden="true"
            >
              {{ latestMusing.emoticon }}
            </span>

            <div class="min-w-0 flex-1">
              <p
                class="text-[0.65rem] font-black uppercase tracking-wide text-primary/70"
              >
                {{ latestMusing.label }}
              </p>

              <p class="mt-1 line-clamp-3 leading-relaxed text-base-content/80">
                {{ latestMusing.message }}
              </p>
            </div>
          </div>
        </article>
      </Transition>

      <button
        type="button"
        class="narrator-dock group relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-base-300/90 shadow-2xl transition-transform duration-300 hover:scale-105 md:rounded-full"
        :aria-expanded="isOpen"
        :aria-label="`Open ${narratorName}`"
        :title="narratorHoverTitle"
        @click="openNarrator"
      >
        <div
          class="absolute -inset-1 rounded-full bg-primary/20 opacity-0 blur-xl transition group-hover:opacity-100"
        />

        <div
          class="magic-card relative h-full w-full"
          :class="expressionTricking ? 'is-tricking' : ''"
        >
          <div
            v-if="showExpressionBack"
            class="expression-card-back absolute inset-1 rounded-3xl md:rounded-full"
            aria-hidden="true"
          />

          <img
            v-else
            :src="displayedNarratorImage"
            :alt="narratorName"
            class="narrator-dock-img relative h-full w-full cursor-pointer p-1"
            loading="lazy"
            @dblclick.stop="playReactionOnClick"
          />
        </div>

        <span
          v-if="currentEmotionRow?.emoticon"
          class="absolute -right-0.5 -top-0.5 rounded-full border border-base-300 bg-base-100 px-1 py-0.5 text-xs shadow"
        >
          {{ currentEmotionRow.emoticon }}
        </span>

        <div class="pointer-events-none absolute inset-0">
          <span
            v-for="burst in emojiBursts"
            :key="burst.id"
            class="emoji-burst"
            :style="{
              left: `${burst.x}%`,
              top: `${burst.y}%`,
              animationDelay: `${burst.delay}ms`,
            }"
          >
            {{ burst.emoji }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { navigateTo } from '#app'
import { storeToRefs } from 'pinia'
import { useNarratorStore } from '@/stores/narratorStore'

type TopicButton = {
  key: string
  title: string
  description: string
  icon: string
  prompt: string
  openingText: string
  route: string
}

type MusingEntry = {
  id: string
  label: string
  message: string
  emoticon: string | null
}

type EmojiBurst = {
  id: string
  emoji: string
  x: number
  y: number
  delay: number
}

const props = withDefaults(
  defineProps<{
    open?: boolean
    coexist?: boolean
  }>(),
  {
    open: false,
    coexist: false,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:rendered': [value: boolean]
}>()

const narratorStore = useNarratorStore()

const {
  isOpen,
  pinOpen,
  activeBubble,
  bubblesEnabled,
  currentEmotion,
  currentEmotionRow,
  narratorName,
  narratorMenuSummary,
  narratorHoverTitle,
  narratorImage,
  narratorThreads,
  currentEmotionLabel,
  narratorIntro,
  narratorSession,
  narratorMessage,
  statusMessage,
  statusTone,
  isNarratorResponding,
  canUseNarrator,
  canSendNarrator,
  narratorPlaceholder,
  shouldRender,
} = storeToRefs(narratorStore)

const {
  initialize,
  disposeTimers,
  togglePin,
  closePanel,
  clearBubble,
  clearSession,
  sendNarratorMessage,
  playReactionOnClick,
  teardownLiveness,
  setStatus,
} = narratorStore

const chatLogRef = ref<HTMLElement | null>(null)
const chatFaceOpen = ref(false)
const showTopics = ref(false)
const selectedTopicKey = ref('')
const displayedNarratorImage = ref('')
const expressionTricking = ref(false)
const showExpressionBack = ref(false)
const musingHistory = ref<MusingEntry[]>([])
const emojiBursts = ref<EmojiBurst[]>([])

let expressionTimerOne: ReturnType<typeof setTimeout> | null = null
let expressionTimerTwo: ReturnType<typeof setTimeout> | null = null
let expressionTimerThree: ReturnType<typeof setTimeout> | null = null
let emojiTimer: ReturnType<typeof setTimeout> | null = null

const narratorDockVisible = computed(() => {
  return Boolean(shouldRender.value || narratorImage.value)
})

const latestMusing = computed(() => {
  return musingHistory.value.at(-1) ?? null
})

const topicButtons = computed<TopicButton[]>(() => {
  const threadButtons = narratorThreads.value.map((thread) => {
    const topic = thread.Topic
    const slug = String(topic?.slug || thread.title || '').toLowerCase()
    const title = thread.title || topic?.title || 'Narrator thread'
    const lowerTitle = title.toLowerCase()
    const isScenario =
      slug.includes('scenario') ||
      slug.includes('story') ||
      lowerTitle.includes('scenario') ||
      lowerTitle.includes('story')

    return {
      key: `thread-${thread.id}`,
      title,
      description:
        topic?.subtitle ||
        topic?.description ||
        thread.guidance ||
        thread.openingText ||
        'Talk through this narrator mode.',
      icon: topic?.icon || (isScenario ? 'kind-icon:book' : 'kind-icon:message'),
      prompt: topic?.sampleUserPrompt || topic?.prompt || '',
      openingText: thread.openingText || '',
      route: isScenario ? '/stories' : '',
    }
  })

  if (threadButtons.length) return threadButtons

  return [
    {
      key: 'build',
      title: 'Build',
      description: 'Create characters, scenarios, rewards, and story seeds.',
      icon: 'kind-icon:wand',
      prompt:
        'Help me build something useful for this Dream. Suggest one strong next step and ask me one focused question if needed.',
      openingText:
        'Let’s turn the vague sparkly thing into an actual usable thing.',
      route: '',
    },
    {
      key: 'stories',
      title: 'Stories',
      description: 'Open the story workspace for scenario interactions.',
      icon: 'kind-icon:book',
      prompt: '',
      openingText:
        'Stories belong in the story room. Very official. Tiny velvet rope.',
      route: '/stories',
    },
    {
      key: 'lore',
      title: 'Lore',
      description: 'Ask about Kind Robots, AMI, Dreams, and site concepts.',
      icon: 'kind-icon:dream',
      prompt:
        'Explain the relevant Kind Robots lore, Dream context, and what I can do from here.',
      openingText:
        'Lore mode: less spreadsheet, more secret butterfly constitution.',
      route: '',
    },
  ]
})

const selectedTopic = computed(() => {
  return (
    topicButtons.value.find((topic) => topic.key === selectedTopicKey.value) ??
    topicButtons.value[0] ??
    null
  )
})

const selectedTopicTitle = computed(() => {
  return selectedTopic.value?.title || 'Narrator'
})

const selectedTopicIcon = computed(() => {
  return selectedTopic.value?.icon || 'kind-icon:message'
})

const selectedTopicIntro = computed(() => {
  return selectedTopic.value?.openingText || ''
})

function openNarrator(): void {
  isOpen.value = true
  clearBubble()
}

function closeNarrator(): void {
  chatFaceOpen.value = false
  showTopics.value = false
  closePanel(false)
}

function openChatFace(): void {
  chatFaceOpen.value = true
  showTopics.value = !narratorSession.value.length
}

function closeChatFace(): void {
  chatFaceOpen.value = false
  showTopics.value = false
}

async function selectTopic(topic: TopicButton): Promise<void> {
  selectedTopicKey.value = topic.key
  showTopics.value = false

  addMusing(topic.openingText || topic.description, topic.title)

  if (topic.route) {
    setStatus(`${topic.title}: opening workspace.`, 'success')
    closeNarrator()
    await navigateTo(topic.route)
    return
  }

  if (topic.prompt) {
    narratorMessage.value = topic.prompt
  }
}

function addMusing(
  message: string | null | undefined,
  label = currentEmotionLabel.value,
): void {
  const trimmed = message?.trim()
  if (!trimmed) return

  const last = musingHistory.value.at(-1)
  if (last?.message === trimmed && last?.label === label) return

  musingHistory.value.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label,
    message: trimmed,
    emoticon: currentEmotionRow.value?.emoticon ?? null,
  })

  if (musingHistory.value.length > 24) {
    musingHistory.value = musingHistory.value.slice(-24)
  }
}

function expressionEmoji(): string {
  const lookup: Record<string, string[]> = {
    NEUTRAL: ['✨', '🦋', '🌈'],
    JOYFUL: ['😊', '✨', '🎉'],
    SORROWFUL: ['🌧️', '💧', '🫧'],
    AFRAID: ['😨', '⚡', '🌀'],
    DISGUSTED: ['🤢', '🍃', '💨'],
    ENRAGED: ['🔥', '💥', '😤'],
    SURPRISED: ['😮', '✨', '❗'],
    ANXIOUS: ['🌀', '💫', '🫧'],
    PROUD: ['🌟', '🏆', '✨'],
    LOVING: ['💗', '🦋', '🌸'],
    LAUGHING: ['😂', '✨', '🎭'],
    CRYING: ['😭', '💧', '🌧️'],
    SLEEPING: ['😴', '🌙', '💤'],
    THINKING: ['🤔', '💭', '🧠'],
    SHRUGGING: ['🤷', '✨', '🙃'],
    WINKING: ['😉', '✨', '⭐'],
    FACEPALMING: ['🤦', '💫', '🙃'],
    CHEERING: ['🎉', '📣', '✨'],
    WHISPERING: ['🤫', '🫧', '✨'],
    SHOUTING: ['📣', '⚡', '💥'],
    CUSTOM: ['✨', '🦋', '🌈'],
  }

  const options = lookup[currentEmotion.value] ?? lookup.NEUTRAL
  return options[Math.floor(Math.random() * options.length)] ?? '✨'
}

function spawnEmojiBurst(): void {
  const bursts = Array.from({ length: 8 }, () => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    emoji: expressionEmoji(),
    x: 18 + Math.random() * 64,
    y: 24 + Math.random() * 52,
    delay: Math.floor(Math.random() * 180),
  }))

  emojiBursts.value = [...emojiBursts.value, ...bursts].slice(-18)

  if (emojiTimer) clearTimeout(emojiTimer)

  emojiTimer = setTimeout(() => {
    emojiBursts.value = []
    emojiTimer = null
  }, 1600)
}

function runExpressionTrick(nextImage: string): void {
  if (!nextImage) return

  if (!displayedNarratorImage.value) {
    displayedNarratorImage.value = nextImage
    return
  }

  if (nextImage === displayedNarratorImage.value) return

  if (expressionTimerOne) clearTimeout(expressionTimerOne)
  if (expressionTimerTwo) clearTimeout(expressionTimerTwo)
  if (expressionTimerThree) clearTimeout(expressionTimerThree)

  expressionTricking.value = true
  showExpressionBack.value = false
  spawnEmojiBurst()

  expressionTimerOne = setTimeout(() => {
    showExpressionBack.value = true
  }, 170)

  expressionTimerTwo = setTimeout(() => {
    displayedNarratorImage.value = nextImage
  }, 390)

  expressionTimerThree = setTimeout(() => {
    showExpressionBack.value = false

    setTimeout(() => {
      expressionTricking.value = false
    }, 240)

    expressionTimerOne = null
    expressionTimerTwo = null
    expressionTimerThree = null
  }, 520)
}

function scrollChatToBottom(): void {
  const element = chatLogRef.value
  if (!element) return

  element.scrollTop = element.scrollHeight
}

watch(
  () => props.open,
  (value) => {
    if (value && !isOpen.value) {
      isOpen.value = true
    }
  },
)

watch(isOpen, (value) => {
  emit('update:open', value)

  if (!value) {
    chatFaceOpen.value = false
    showTopics.value = false
  }
})

watch(
  narratorDockVisible,
  (value) => {
    emit('update:rendered', Boolean(value))
  },
  { immediate: true },
)

watch(
  () => narratorImage.value,
  (nextImage) => {
    runExpressionTrick(nextImage)
  },
)

watch(currentEmotionLabel, async (label, previousLabel) => {
  if (!label || label === previousLabel) return

  const rowMessage =
    currentEmotionRow.value?.message ||
    `Mood shifted to ${label.toLowerCase()}.`

  addMusing(rowMessage, label)
  spawnEmojiBurst()

  await nextTick()
})

watch(activeBubble, async (message) => {
  if (!bubblesEnabled.value) return

  addMusing(message, currentEmotionLabel.value)
  clearBubble()

  await nextTick()
})

watch(
  () => narratorSession.value.map((chat) => chat.botResponse).join(''),
  async () => {
    await nextTick()
    scrollChatToBottom()
  },
)

watch(
  topicButtons,
  (topics) => {
    if (!topics.length) {
      selectedTopicKey.value = ''
      return
    }

    const exists = topics.some((topic) => topic.key === selectedTopicKey.value)

    if (!exists) {
      selectedTopicKey.value = topics[0]?.key ?? ''
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await initialize()

  displayedNarratorImage.value = narratorImage.value
  addMusing(narratorIntro.value, 'Narrator')

  if (props.open) {
    isOpen.value = true
  }
})

onBeforeUnmount(() => {
  disposeTimers()
  teardownLiveness()

  if (expressionTimerOne) clearTimeout(expressionTimerOne)
  if (expressionTimerTwo) clearTimeout(expressionTimerTwo)
  if (expressionTimerThree) clearTimeout(expressionTimerThree)
  if (emojiTimer) clearTimeout(emojiTimer)
})
</script>

<style scoped>
.narrator-dock {
  height: min(32dvh, 12rem);
  width: var(--narrator-circle);
}

.narrator-dock-img {
  object-fit: contain;
}

.narrator-card-stage {
  perspective: 1600px;
}

.narrator-card-shell {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 650ms cubic-bezier(0.4, 0.1, 0.2, 1);
}

.narrator-card-shell.is-chat-face {
  transform: rotateY(180deg);
}

.narrator-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
}

.narrator-face-front {
  transform: rotateY(0deg);
}

.narrator-face-back {
  transform: rotateY(180deg);
}

.magic-card {
  position: relative;
  transform-style: preserve-3d;
}

.magic-card.is-tricking {
  animation: expression-card-trick 760ms cubic-bezier(0.4, 0.1, 0.2, 1);
}

.expression-card-back {
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 18%, rgb(255 255 255 / 0.24), transparent 28%),
    radial-gradient(circle at 80% 72%, rgb(255 255 255 / 0.18), transparent 32%),
    linear-gradient(135deg, rgb(var(--p) / 0.28), rgb(var(--s) / 0.22)),
    repeating-linear-gradient(
      45deg,
      rgb(255 255 255 / 0.08) 0,
      rgb(255 255 255 / 0.08) 0.35rem,
      transparent 0.35rem,
      transparent 0.7rem
    );
  border: 1px solid rgb(255 255 255 / 0.24);
  box-shadow:
    inset 0 0 0 1px rgb(0 0 0 / 0.08),
    0 1rem 2rem rgb(0 0 0 / 0.18);
}

.expression-card-back-core {
  display: flex;
  height: 7rem;
  width: 7rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgb(255 255 255 / 0.26);
  background: rgb(var(--b1) / 0.72);
  box-shadow: 0 1rem 2rem rgb(0 0 0 / 0.16);
}

.emoji-burst {
  position: absolute;
  z-index: 20;
  font-size: 1.35rem;
  line-height: 1;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.6);
  animation: emoji-float 1300ms ease-out forwards;
  filter: drop-shadow(0 0.25rem 0.45rem rgb(0 0 0 / 0.22));
}

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
.narrator-musing-enter-active,
.narrator-musing-leave-active,
.narrator-topics-enter-active,
.narrator-topics-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.narrator-panel-enter-from,
.narrator-panel-leave-to {
  opacity: 0;
  transform: translateX(1rem) translateY(0.5rem) scale(0.98);
}

.narrator-musing-enter-from,
.narrator-musing-leave-to {
  opacity: 0;
  transform: translateY(0.5rem) scale(0.98);
}

.narrator-topics-enter-from,
.narrator-topics-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

@keyframes expression-card-trick {
  0% {
    transform: rotateY(0deg) scale(1);
  }

  34% {
    transform: rotateY(92deg) scale(1.035);
  }

  52% {
    transform: rotateY(180deg) scale(1.05);
  }

  74% {
    transform: rotateY(268deg) scale(1.035);
  }

  100% {
    transform: rotateY(360deg) scale(1);
  }
}

@keyframes emoji-float {
  0% {
    opacity: 0;
    transform: translate(-50%, -25%) scale(0.5) rotate(-8deg);
  }

  18% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -190%) scale(1.22) rotate(14deg);
  }
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

@media (min-width: 768px) {
  .narrator-dock {
    height: var(--narrator-circle);
    width: var(--narrator-circle);
  }

  .narrator-dock-img {
    object-fit: cover;
    padding: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .narrator-card-shell,
  .magic-card.is-tricking,
  .narrator-panel-enter-active,
  .narrator-panel-leave-active,
  .narrator-musing-enter-active,
  .narrator-musing-leave-active,
  .narrator-topics-enter-active,
  .narrator-topics-leave-active,
  .emoji-burst,
  .narrator-dot {
    animation: none;
    transition: none;
  }
}
</style>