<!-- /components/navigation/workspace-narrator.vue -->
<template>
  <div
    v-if="narratorDockVisible"
    class="pointer-events-none absolute inset-y-0 right-0 h-full w-full overflow-visible"
  >
    <Transition name="narrator-panel">
      <section
        v-if="isOpen"
        class="pointer-events-auto absolute inset-y-0 right-0 z-40 flex h-full w-full max-w-[100vw] min-w-0 flex-col overflow-hidden rounded-2xl border border-primary/25 bg-base-100/95 shadow-2xl backdrop-blur-xl sm:rounded-3xl"
        :data-coexist="coexist ? 'true' : 'false'"
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
                  class="group relative flex min-h-0 flex-1 items-stretch justify-stretch overflow-hidden rounded-4xl border border-primary/20 bg-base-100/70 shadow-inner"
                  :aria-label="`Shift ${narratorName} expression`"
                  @click="playReactionOnClick"
                >
                  <div
                    class="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-secondary/10 opacity-80"
                  />

                  <FlipCard
                    class="relative z-10 h-full w-full"
                    :trigger-key="expressionFlipToken"
                    radius="1.75rem"
                    @halfway="commitExpressionImage"
                  >
                    <template #front>
                      <img
                        :src="displayedNarratorImage"
                        :alt="narratorName"
                        class="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </template>

                    <template #back>
                      <img
                        :src="narratorCardBackSrc"
                        :alt="`Card back ${cardBack}`"
                        class="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </template>
                  </FlipCard>

                  <Transition name="narrator-toast">
                    <article
                      v-if="latestMusing"
                      class="pointer-events-none absolute inset-x-3 bottom-3 z-20 rounded-2xl border border-primary/25 bg-base-100/95 px-3 py-2 text-left text-sm shadow-2xl backdrop-blur"
                    >
                      <div class="flex items-start gap-2">
                        <span
                          v-if="latestMusing.emoticon"
                          class="mt-0.5 text-base leading-none"
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
                            class="mt-1 line-clamp-2 leading-relaxed text-base-content/80"
                          >
                            {{ latestMusing.message }}
                          </p>
                        </div>
                      </div>
                    </article>
                  </Transition>

                  <div class="pointer-events-none absolute inset-0 z-30">
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

                <div class="relative flex items-start justify-between gap-3">
                  <button
                    type="button"
                    class="min-w-0 text-left"
                    @click="closeChatFace"
                  >
                    <p
                      class="truncate text-base font-black leading-tight text-base-content"
                    >
                      {{ narratorName }}
                    </p>

                    <p
                      class="mt-1 truncate text-[0.65rem] font-black uppercase tracking-widest text-primary/75"
                    >
                      {{ currentEmotionLabel }}
                    </p>
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

                <div
                  class="relative mt-3 h-[25dvh] min-h-36 max-h-60 overflow-hidden rounded-4xl border border-primary/20 bg-base-300 shadow-inner"
                >
                  <FlipCard
                    class="h-full w-full"
                    :trigger-key="expressionFlipToken"
                    radius="1.75rem"
                    @halfway="commitExpressionImage"
                  >
                    <template #front>
                      <img
                        :src="displayedNarratorImage"
                        :alt="narratorName"
                        class="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </template>

                    <template #back>
                      <img
                        :src="narratorCardBackSrc"
                        :alt="`Card back ${cardBack}`"
                        class="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </template>
                  </FlipCard>
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
                          class="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-base-content/75"
                        >
                          {{ selectedTopicIntro }}
                        </p>

                        <div
                          v-if="selectedTopicStarters.length"
                          class="mt-3 flex flex-wrap gap-2"
                        >
                          <button
                            v-for="starter in selectedTopicStarters"
                            :key="starter.key"
                            type="button"
                            class="btn btn-outline btn-xs rounded-2xl"
                            @click="selectStarter(starter)"
                          >
                            {{ starter.label }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>

                  <article
                    v-if="!seededMessages.length && !narratorSession.length"
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
                    v-for="message in seededMessages"
                    :key="message.id"
                    class="flex max-w-[92%] gap-2"
                  >
                    <img
                      :src="displayedNarratorImage"
                      :alt="narratorName"
                      class="h-8 w-8 shrink-0 rounded-full border border-base-300 bg-base-300 object-cover"
                      loading="lazy"
                    />

                    <div
                      class="rounded-2xl rounded-bl-sm bg-base-100 px-3 py-2 text-sm leading-relaxed shadow-sm"
                    >
                      <p
                        class="text-[0.65rem] font-black uppercase tracking-wide text-primary/70"
                      >
                        {{ message.title }}
                      </p>

                      <p class="mt-1 whitespace-pre-wrap text-base-content/80">
                        {{ message.body }}
                      </p>

                      <div
                        v-if="message.followups.length"
                        class="mt-3 flex flex-wrap gap-2"
                      >
                        <button
                          v-for="starter in message.followups"
                          :key="starter.key"
                          type="button"
                          class="btn btn-outline btn-xs rounded-2xl"
                          @click="selectStarter(starter)"
                        >
                          {{ starter.label }}
                        </button>
                      </div>
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

              <footer class="shrink-0 border-t border-base-300 bg-base-100 p-3">
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
                      @click="clearNarratorThread"
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
      v-if="!isOpen && dockVisible"
      class="pointer-events-auto absolute bottom-3 right-3 z-50 flex items-end gap-2"
    >
      <Transition name="narrator-toast">
        <article
          v-if="latestMusing"
          class="narrator-compact-toast mb-1 rounded-2xl border border-primary/25 bg-base-100/95 px-3 py-2 text-sm shadow-2xl backdrop-blur"
        >
          <div class="flex items-start gap-2">
            <span
              v-if="latestMusing.emoticon"
              class="mt-0.5 text-base leading-none"
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

              <p class="mt-1 line-clamp-2 leading-relaxed text-base-content/80">
                {{ latestMusing.message }}
              </p>
            </div>
          </div>
        </article>
      </Transition>

      <button
        type="button"
        class="narrator-dock group relative shrink-0 overflow-hidden rounded-3xl border-2 border-primary/40 bg-base-300/90 shadow-2xl transition-transform duration-300 hover:scale-105 md:rounded-full"
        :aria-expanded="isOpen"
        :aria-label="`Open ${narratorName}`"
        :title="narratorHoverTitle"
        @click="openNarrator"
      >
        <div
          class="absolute -inset-1 rounded-full bg-primary/20 opacity-0 blur-xl transition group-hover:opacity-100"
        />

        <FlipCard
          class="relative h-full w-full"
          :trigger-key="expressionFlipToken"
          radius="9999px"
          @halfway="commitExpressionImage"
        >
          <template #front>
            <img
              :src="displayedNarratorImage"
              :alt="narratorName"
              class="narrator-dock-img h-full w-full cursor-pointer p-1"
              loading="lazy"
              @dblclick.stop="playReactionOnClick"
            />
          </template>

          <template #back>
            <img
              :src="narratorCardBackSrc"
              :alt="`Card back ${cardBack}`"
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </template>
        </FlipCard>

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
import FlipCard from './flip-card.vue'
import { useNarratorStore } from '@/stores/narratorStore'
import { useUserStore } from '@/stores/userStore'

type RawStarterPrompt = {
  label?: string | null
  title?: string | null
  prompt?: string | null
  answer?: string | null
  response?: string | null
  flavor?: string | null
  openingText?: string | null
  action?: string | null
  path?: string | null
  key?: string | null
  screen?: string | null
}

type ThreadStarter = {
  key: string
  label: string
  prompt: string
  answer: string
  action: string
  path: string
}

type TopicButton = {
  key: string
  title: string
  description: string
  icon: string
  prompt: string
  openingText: string
  route: string
  starters: ThreadStarter[]
}

type MusingEntry = {
  id: string
  label: string
  message: string
  emoticon: string | null
}

type SeededMessage = {
  id: string
  title: string
  body: string
  followups: ThreadStarter[]
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
    dockVisible?: boolean
  }>(),
  {
    open: false,
    coexist: false,
    dockVisible: true,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:rendered': [value: boolean]
  'update:compactMessageVisible': [value: boolean]
}>()

const CARD_BACKS = [1, 2, 3, 4, 5] as const
type CardBack = (typeof CARD_BACKS)[number]

const CARD_BACK_STORAGE_KEY = 'kr.workspaceCardBack'

const narratorStore = useNarratorStore()
const userStore = useUserStore()

const {
  isOpen,
  pinOpen,
  activeBubble,
  bubblesEnabled,
  currentEmotion,
  currentEmotionRow,
  narratorName,
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
const cardBack = ref<CardBack>(1)
const displayedNarratorImage = ref('')
const queuedNarratorImage = ref('')
const expressionFlipToken = ref(0)
const musingHistory = ref<MusingEntry[]>([])
const seededMessages = ref<SeededMessage[]>([])
const emojiBursts = ref<EmojiBurst[]>([])

let musingTimer: ReturnType<typeof setTimeout> | null = null
let emojiTimer: ReturnType<typeof setTimeout> | null = null

const narratorDockVisible = computed(() => {
  return Boolean(shouldRender.value || narratorImage.value)
})

const latestMusing = computed(() => {
  return musingHistory.value.at(-1) ?? null
})

const compactMessageVisible = computed(() => {
  return Boolean(!isOpen.value && latestMusing.value)
})

const narratorCardBackSrc = computed(() => {
  return cardBackSrc(cardBack.value)
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
      icon:
        topic?.icon || (isScenario ? 'kind-icon:book' : 'kind-icon:message'),
      prompt: topic?.sampleUserPrompt || topic?.prompt || '',
      openingText: thread.openingText || topic?.description || '',
      route: isScenario ? '/stories' : '',
      starters: parseStarterPrompts(thread.starterPrompts),
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
      starters: [
        {
          key: 'build-character',
          label: 'Character seed',
          prompt:
            'Help me create one useful character for this Dream. Include name, role, visual hook, and conflict.',
          answer:
            'A strong character seed usually starts with a job, a wound, and a weird visual tell. I can help you turn that into a proper character record.',
          action: '',
          path: '',
        },
        {
          key: 'build-reward',
          label: 'Reward seed',
          prompt:
            'Help me create one useful reward for this Dream. Include rarity, effect, flavor text, and visual hook.',
          answer:
            'Rewards work best when they feel like souvenirs from the story world, not just inventory confetti.',
          action: '',
          path: '',
        },
      ],
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
      starters: [],
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
      starters: [
        {
          key: 'lore-ami',
          label: 'Who is AMI?',
          prompt: '',
          answer:
            'AMI is the Anti-Malaria Intelligence: a swarm of rainbow butterflies, a narrator spirit, and a tiny act of useful rebellion against mosquito-borne misery.',
          action: '',
          path: '',
        },
      ],
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

const selectedTopicStarters = computed(() => {
  return selectedTopic.value?.starters ?? []
})

function cardBackSrc(back: CardBack): string {
  return `/images/adventure/card/card-back${back}.webp`
}

function readPreferredCardBack(): CardBack {
  const source = userStore as unknown as {
    workspaceCardBack?: number | string | null
    cardBack?: number | string | null
    user?: {
      workspaceCardBack?: number | string | null
      cardBack?: number | string | null
    } | null
  }

  const candidates = [
    source.workspaceCardBack,
    source.cardBack,
    source.user?.workspaceCardBack,
    source.user?.cardBack,
  ]

  for (const candidate of candidates) {
    const parsed = Number(candidate)

    if (CARD_BACKS.includes(parsed as CardBack)) {
      return parsed as CardBack
    }
  }

  if (import.meta.client) {
    try {
      const stored = window.localStorage.getItem(CARD_BACK_STORAGE_KEY)
      const parsed = stored ? Number(stored) : NaN

      if (CARD_BACKS.includes(parsed as CardBack)) {
        return parsed as CardBack
      }
    } catch {}
  }

  return 1
}

function parseStarterPrompts(value: unknown): ThreadStarter[] {
  const rawItems = Array.isArray(value) ? value : []

  return rawItems
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null

      const raw = item as RawStarterPrompt
      const label = raw.label || raw.title || `Option ${index + 1}`
      const prompt = raw.prompt || ''
      const answer =
        raw.answer || raw.response || raw.flavor || raw.openingText || ''
      const action = raw.action || ''
      const path = raw.path || ''
      const key = raw.key || `${label}-${index}`

      return {
        key,
        label,
        prompt,
        answer,
        action,
        path,
      }
    })
    .filter((item): item is ThreadStarter => Boolean(item?.label))
}

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
  showTopics.value =
    !seededMessages.value.length && !narratorSession.value.length
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

  seededMessages.value.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: topic.title,
    body:
      topic.openingText ||
      topic.description ||
      'This thread is ready. Pick a path or ask a custom question.',
    followups: topic.starters,
  })

  if (topic.prompt && !topic.starters.length) {
    narratorMessage.value = topic.prompt
  }

  await nextTick()
  scrollChatToBottom()
}

async function selectStarter(starter: ThreadStarter): Promise<void> {
  if (starter.action === 'navigate' && starter.path) {
    closeNarrator()
    await navigateTo(starter.path)
    return
  }

  if (starter.answer) {
    seededMessages.value.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: starter.label,
      body: starter.answer,
      followups: [],
    })
  }

  if (starter.prompt) {
    narratorMessage.value = starter.prompt
  }

  await nextTick()
  scrollChatToBottom()
}

function clearNarratorThread(): void {
  clearSession()
  seededMessages.value = []
  narratorMessage.value = ''
  statusMessage.value = ''
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

  if (musingTimer) clearTimeout(musingTimer)

  musingTimer = setTimeout(() => {
    musingHistory.value = []
    musingTimer = null
  }, 6500)
}

function expressionEmoji(): string {
  const fallbackOptions = ['✨', '🦋', '🌈']

  const lookup: Partial<Record<string, string[]>> = {
    NEUTRAL: fallbackOptions,
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
    CUSTOM: fallbackOptions,
  }

  const options = lookup[currentEmotion.value] ?? fallbackOptions
  const index = Math.floor(Math.random() * options.length)

  return options[index] ?? fallbackOptions[0] ?? '✨'
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

function runExpressionFlip(nextImage: string, force = false): void {
  if (!nextImage) return

  if (!displayedNarratorImage.value) {
    displayedNarratorImage.value = nextImage
    queuedNarratorImage.value = nextImage
    return
  }

  queuedNarratorImage.value = nextImage

  if (force || nextImage !== displayedNarratorImage.value) {
    expressionFlipToken.value += 1
    spawnEmojiBurst()
    return
  }

  expressionFlipToken.value += 1
  spawnEmojiBurst()
}

function commitExpressionImage(): void {
  displayedNarratorImage.value =
    queuedNarratorImage.value || displayedNarratorImage.value
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
    } else if (!value && isOpen.value) {
      closePanel(false)
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
  compactMessageVisible,
  (value) => {
    emit('update:compactMessageVisible', value)
  },
  { immediate: true },
)

watch(
  () => narratorImage.value,
  (nextImage) => {
    runExpressionFlip(nextImage, true)
  },
)

watch(currentEmotionLabel, async (label, previousLabel) => {
  if (!label || label === previousLabel) return

  const rowMessage =
    currentEmotionRow.value?.message ||
    `Mood shifted to ${label.toLowerCase()}.`

  addMusing(rowMessage, label)
  runExpressionFlip(narratorImage.value, true)

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

  cardBack.value = readPreferredCardBack()
  displayedNarratorImage.value = narratorImage.value
  queuedNarratorImage.value = narratorImage.value
  addMusing(narratorIntro.value, 'Narrator')

  if (props.open) {
    isOpen.value = true
  }
})

onBeforeUnmount(() => {
  disposeTimers()
  teardownLiveness()

  if (musingTimer) clearTimeout(musingTimer)
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

.narrator-compact-toast {
  width: clamp(
    12rem,
    calc((100vw - var(--sheet-w, 0px)) / 2 - var(--narrator-circle) - 1rem),
    24rem
  );
  max-width: calc(100vw - var(--narrator-circle) - 2rem);
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
.narrator-toast-enter-active,
.narrator-toast-leave-active,
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
.narrator-musing-leave-to,
.narrator-toast-enter-from,
.narrator-toast-leave-to {
  opacity: 0;
  transform: translateX(0.75rem) translateY(0.25rem) scale(0.98);
}

.narrator-topics-enter-from,
.narrator-topics-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
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
  .narrator-panel-enter-active,
  .narrator-panel-leave-active,
  .narrator-musing-enter-active,
  .narrator-musing-leave-active,
  .narrator-toast-enter-active,
  .narrator-toast-leave-active,
  .narrator-topics-enter-active,
  .narrator-topics-leave-active,
  .emoji-burst,
  .narrator-dot {
    animation: none;
    transition: none;
  }
}
</style>