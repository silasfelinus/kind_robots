<!-- /components/navigation/workspace-narrator.vue -->
<template>
  <div
    v-if="shouldRender"
    class="pointer-events-none z-100 overflow-visible"
    :class="narratorFrameClass"
  >
    <Transition name="narrator-bubble">
      <aside
        v-if="activeBubble && bubblesEnabled && !isOpen"
        class="narrator-speech pointer-events-auto absolute z-120 w-[min(calc(100vw-1.5rem),20rem)] rounded-[1.75rem] border-2 border-primary/30 bg-base-100/95 p-3 text-sm leading-relaxed text-base-content shadow-2xl backdrop-blur"
        :class="bubbleFrameClass"
      >
        <div class="flex items-start gap-2">
          <span class="text-xl leading-none">
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
        class="pointer-events-auto absolute z-110 flex flex-col overflow-hidden rounded-3xl border border-primary/25 bg-base-100/95 shadow-2xl backdrop-blur-xl"
        :class="narratorPanelClass"
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
            <div class="flex min-w-0 gap-3">
              <div
                class="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-primary/30 bg-base-300 shadow-lg sm:h-14 sm:w-14"
              >
                <img
                  :src="narratorImage"
                  :alt="narratorName"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />

                <span
                  v-if="currentEmotionRow?.emoticon"
                  class="absolute -right-1 -top-1 rounded-full border border-base-300 bg-base-100 px-1.5 py-0.5 text-sm shadow"
                >
                  {{ currentEmotionRow.emoticon }}
                </span>
              </div>

              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="truncate text-base font-black text-base-content">
                    {{ narratorName }}
                  </h2>

                  <span class="badge badge-primary badge-sm rounded-xl">
                    {{ currentEmotionLabel }}
                  </span>
                </div>

                <p
                  class="mt-1 line-clamp-1 text-xs leading-relaxed text-base-content/65 sm:line-clamp-2"
                >
                  {{ narratorMenuSummary }}
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
          </div>

          <div class="relative mt-3 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              class="btn btn-xs rounded-2xl sm:btn-sm"
              :class="screenButtonClass('narrator')"
              @click="setScreen('narrator')"
            >
              <Icon name="kind-icon:message" class="h-4 w-4" />
              Narrator
            </button>

            <button
              type="button"
              class="btn btn-xs rounded-2xl sm:btn-sm"
              :class="screenButtonClass('scenarios')"
              @click="setScreen('scenarios')"
            >
              <Icon name="kind-icon:map" class="h-4 w-4" />
              Scenarios
              <span
                v-if="dreamScenarios.length"
                class="badge badge-xs rounded-full"
              >
                {{ dreamScenarios.length }}
              </span>
            </button>
          </div>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <section
            class="rounded-3xl border border-base-300 bg-base-200/80 p-3 shadow-inner"
          >
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
                  class="mt-1 line-clamp-2 text-sm leading-relaxed text-base-content/65 sm:line-clamp-3"
                >
                  {{ activeDreamSummary }}
                </p>
              </div>
            </div>
          </section>

          <section v-if="activeScreen === 'narrator'" class="mt-3">
            <section
              v-if="showMoodRing && emotionOptions.length"
              class="rounded-3xl border border-base-300 bg-base-200/80 p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p
                  class="text-xs font-black uppercase tracking-wide text-primary"
                >
                  Mood Ring
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
              class="mt-3 max-h-56 overflow-y-auto rounded-3xl border border-base-300 bg-base-200/80 p-3 sm:max-h-64"
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
                <div class="flex flex-wrap gap-2">
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
                </div>

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
              </div>
            </section>
          </section>

          <section v-else class="mt-3 grid gap-3">
            <section
              v-if="activeDream && dreamScenarios.length"
              class="grid gap-3"
            >
              <div class="grid gap-1.5">
                <label
                  for="workspace-narrator-scenario"
                  class="px-1 text-xs font-black uppercase tracking-wide text-primary"
                >
                  Scenario
                </label>

                <select
                  id="workspace-narrator-scenario"
                  v-model="selectedScenarioKey"
                  class="select select-bordered select-sm w-full rounded-2xl bg-base-100"
                >
                  <option
                    v-for="(scenario, index) in dreamScenarios"
                    :key="scenarioKey(scenario, index)"
                    :value="scenarioKey(scenario, index)"
                  >
                    {{ scenarioTitle(scenario) }}
                  </option>
                </select>
              </div>

              <article
                v-if="selectedScenario"
                class="overflow-hidden rounded-3xl border border-primary/25 bg-base-100 shadow-lg"
              >
                <div
                  v-if="scenarioImage(selectedScenario)"
                  class="relative h-32 overflow-hidden bg-base-300 sm:h-36"
                >
                  <img
                    :src="scenarioImage(selectedScenario)"
                    :alt="scenarioTitle(selectedScenario)"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  />

                  <div
                    class="absolute inset-0 bg-linear-to-t from-base-100 via-base-100/20 to-transparent"
                  />
                </div>

                <div class="p-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p
                        class="text-xs font-black uppercase tracking-wide text-primary"
                      >
                        Selected Scenario
                      </p>

                      <h3 class="mt-1 line-clamp-1 font-black">
                        {{ scenarioTitle(selectedScenario) }}
                      </h3>
                    </div>

                    <span class="badge badge-secondary badge-sm rounded-xl">
                      Ready
                    </span>
                  </div>

                  <p
                    class="mt-2 line-clamp-4 text-sm leading-relaxed text-base-content/70"
                  >
                    {{ scenarioSummary(selectedScenario) }}
                  </p>

                  <div class="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      class="btn btn-primary btn-sm rounded-2xl text-white"
                      @click="prepareScenarioStoryPrompt"
                    >
                      <Icon name="kind-icon:play" class="h-4 w-4" />
                      Start
                    </button>

                    <button
                      type="button"
                      class="btn btn-secondary btn-sm rounded-2xl"
                      @click="prepareScenarioBuildPrompt"
                    >
                      <Icon name="kind-icon:wand" class="h-4 w-4" />
                      Remix
                    </button>
                  </div>
                </div>
              </article>

              <div class="hidden gap-2 sm:grid">
                <button
                  v-for="(scenario, index) in dreamScenarios"
                  :key="scenarioKey(scenario, index)"
                  type="button"
                  class="group flex items-center gap-3 rounded-[1.35rem] border bg-base-100 p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  :class="scenarioButtonClass(scenario, index)"
                  @click="selectScenario(scenario, index)"
                >
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-200"
                  >
                    <img
                      v-if="scenarioImage(scenario)"
                      :src="scenarioImage(scenario)"
                      :alt="scenarioTitle(scenario)"
                      class="h-full w-full object-cover"
                      loading="lazy"
                    />

                    <Icon
                      v-else
                      name="kind-icon:map"
                      class="h-5 w-5 text-primary"
                    />
                  </div>

                  <div class="min-w-0 flex-1">
                    <h4
                      class="line-clamp-1 text-sm font-black text-base-content"
                    >
                      {{ scenarioTitle(scenario) }}
                    </h4>

                    <p
                      class="mt-0.5 line-clamp-2 text-xs leading-relaxed text-base-content/60"
                    >
                      {{ scenarioSummary(scenario) }}
                    </p>
                  </div>

                  <Icon
                    name="kind-icon:chevron-right"
                    class="h-4 w-4 shrink-0 text-base-content/35 transition group-hover:text-primary"
                  />
                </button>
              </div>
            </section>

            <section
              v-else-if="activeDream"
              class="rounded-3xl border border-dashed border-base-300 bg-base-200/70 p-4 text-center"
            >
              <Icon name="kind-icon:map" class="mx-auto h-8 w-8 text-primary" />

              <h3 class="mt-2 font-black text-base-content">
                No scenarios connected yet
              </h3>

              <p class="mt-1 text-sm leading-relaxed text-base-content/65">
                This Dream has the vibe. It just needs places to get weird in.
              </p>

              <button
                type="button"
                class="btn btn-primary btn-sm mt-3 rounded-2xl text-white"
                @click="prepareScenarioSeedPrompt"
              >
                <Icon name="kind-icon:wand" class="h-4 w-4" />
                Draft scenario ideas
              </button>
            </section>

            <section v-else class="grid gap-2">
              <p
                class="px-1 text-xs font-black uppercase tracking-wide text-primary"
              >
                Website Guide
              </p>

              <button
                v-for="entry in fallbackNavigationEntries"
                :key="entry.key"
                type="button"
                class="group flex items-center gap-3 rounded-[1.35rem] border border-base-300 bg-base-100 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                @click="openFallbackEntry(entry)"
              >
                <span
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"
                >
                  <Icon :name="entry.icon" class="h-5 w-5" />
                </span>

                <span class="min-w-0 flex-1">
                  <span class="block font-black text-base-content">
                    {{ entry.title }}
                  </span>

                  <span
                    class="mt-0.5 line-clamp-2 block text-sm leading-relaxed text-base-content/65"
                  >
                    {{ entry.description }}
                  </span>
                </span>

                <span class="badge badge-outline rounded-xl">
                  {{ entry.badge }}
                </span>
              </button>
            </section>
          </section>
        </div>
      </section>
    </Transition>
    <section
      class="pointer-events-auto relative z-100 h-full w-full overflow-visible"
    >
      <div
        v-if="!props.mobileToggle"
        class="grid h-full w-full grid-cols-[minmax(0,1fr)_auto] items-end gap-2 rounded-4xl border border-primary/25 bg-base-100/90 p-2 shadow-2xl backdrop-blur transition-transform duration-300 md:rounded-[2.5rem] md:p-3 md:hover:scale-[1.04]"
      >
        <div class="flex min-w-0 flex-col justify-end gap-1 pb-1">
          <button
            type="button"
            class="max-w-full self-start rounded-full border border-base-300/80 bg-base-100/95 px-3 py-1.5 text-left shadow-lg backdrop-blur transition hover:border-primary/40 hover:bg-primary/10"
            title="Mood easter egg"
            aria-label="Change narrator mood"
            @click.stop="cycleEmotion"
          >
            <span
              class="block max-w-32 truncate text-sm font-black leading-tight text-primary md:max-w-44 md:text-base"
            >
              {{ narratorName }}
            </span>

            <span
              class="block max-w-32 truncate text-[0.7rem] font-bold leading-tight text-base-content/70 md:max-w-44 md:text-xs"
            >
              {{ currentEmotionLabel }}
            </span>
          </button>

          <p
            class="hidden max-w-44 rounded-2xl bg-base-100/85 px-3 py-2 text-xs leading-relaxed text-base-content/70 shadow backdrop-blur sm:line-clamp-3 md:block"
          >
            {{ narratorSummary }}
          </p>
        </div>

        <button
          type="button"
          class="group relative h-full min-h-24 w-20 overflow-hidden rounded-[1.75rem] border border-primary/30 bg-base-300 shadow-xl transition hover:scale-105 md:w-[calc(var(--hand-h,9rem)*0.78)] md:rounded-[2.25rem]"
          :aria-expanded="isOpen"
          :title="isOpen ? 'Close narrator' : 'Open narrator'"
          @click="togglePanel"
        >
          <div
            class="absolute -inset-1 rounded-[2.5rem] bg-primary/20 opacity-0 blur-lg transition group-hover:opacity-100"
          />

          <img
            :src="narratorImage"
            :alt="narratorName"
            class="relative h-full w-full object-cover"
            loading="lazy"
          />

          <span
            v-if="currentEmotionRow?.emoticon"
            class="absolute right-1 top-1 rounded-full border border-base-300 bg-base-100 px-2 py-1 text-base shadow md:text-lg"
          >
            {{ currentEmotionRow.emoticon }}
          </span>
        </button>
      </div>

      <button
        v-else
        type="button"
        class="btn btn-secondary btn-circle btn-sm shadow-2xl"
        :class="isOpen ? 'btn-active' : ''"
        :aria-expanded="isOpen"
        :aria-label="isOpen ? 'Close narrator' : 'Open narrator'"
        :title="isOpen ? 'Close narrator' : 'Open narrator'"
        @click="togglePanel"
      >
        <Icon
          :name="isOpen ? 'kind-icon:close' : 'kind-icon:bot'"
          class="h-5 w-5"
        />
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

type NarratorScreen = 'narrator' | 'scenarios'

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

type DreamScenario = {
  id?: number | null
  slug?: string | null
  title?: string | null
  name?: string | null
  description?: string | null
  summary?: string | null
  pitch?: string | null
  flavorText?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  highlightImage?: string | null
  icon?: string | null
  ArtImage?: Partial<ArtImage> | null
  ArtCollection?: {
    ArtImages?: Partial<ArtImage>[]
  } | null
}

type DreamWithNarrator = DreamWithRelations & {
  Bots?: DreamNarratorBot[]
  Scenarios?: DreamScenario[]
}

type NarratorChat = Chat & {
  botResponse?: string | null
}

type ChatRuntimeInput = Parameters<
  ReturnType<typeof useChatStore>['addChat']
>[0]

type FallbackNavigationEntry = {
  key: string
  title: string
  description: string
  badge: string
  icon: string
  tab: string
}

const props = withDefaults(
  defineProps<{
    chromeMinimized?: boolean
    railMode?: boolean
    mobileToggle?: boolean
    closeSignal?: number
  }>(),
  {
    chromeMinimized: false,
    railMode: false,
    mobileToggle: false,
    closeSignal: 0,
  },
)

watch(
  () => props.closeSignal,
  () => {
    isOpen.value = false
  },
)

const emit = defineEmits<{
  'panel-open-change': [value: boolean]
}>()

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
const activeScreen = ref<NarratorScreen>('narrator')
const selectedScenarioKey = ref('')
const currentEmotion = ref<NarratorEmotion>('NEUTRAL')
const showMoodRing = ref(false)
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

const narratorFrameClass = computed(() => {
  if (props.mobileToggle) {
    return [
      'relative h-12 w-12',
      'transition-transform duration-300 ease-out',
      isOpen.value ? 'scale-100' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (props.railMode && !props.chromeMinimized) {
    return [
      'fixed bottom-3 right-3 h-28 w-56 max-w-[calc(100vw-1.5rem)]',
      'transition-[height,width,transform] duration-300 ease-out',
      isOpen.value ? 'h-32 w-[min(24rem,calc(100vw-1.5rem))]' : '',
      'md:relative md:bottom-auto md:right-auto',
      'md:h-[calc(var(--hand-h,9rem)*1.95)] md:w-[calc(var(--hand-h,9rem)*1.38)]',
      'md:max-h-[76dvh] md:min-h-52 md:min-w-44 md:max-w-none',
      isOpen.value
        ? 'md:h-[calc(var(--hand-h,9rem)*2.45)] md:w-[calc(var(--hand-h,9rem)*1.72)]'
        : 'md:hover:h-[calc(var(--hand-h,9rem)*2.55)] md:hover:w-[calc(var(--hand-h,9rem)*1.78)]',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return [
    'fixed bottom-3 right-3 h-28 w-56 max-w-[calc(100vw-1.5rem)]',
    'transition-[height,width,transform] duration-300 ease-out',
    isOpen.value ? 'h-32 w-[min(24rem,calc(100vw-1.5rem))]' : '',
    'sm:bottom-4 sm:right-4',
    'md:h-[calc(var(--hand-h,9rem)*1.7)] md:w-[calc(var(--hand-h,9rem)*1.18)]',
    'md:max-h-[72dvh] md:min-h-48 md:min-w-40 md:max-w-none',
    isOpen.value
      ? 'md:h-[calc(var(--hand-h,9rem)*2.25)] md:w-[calc(var(--hand-h,9rem)*1.52)]'
      : 'md:hover:h-[calc(var(--hand-h,9rem)*2.35)] md:hover:w-[calc(var(--hand-h,9rem)*1.6)]',
  ]
    .filter(Boolean)
    .join(' ')
})

const narratorPanelClass = computed(() => {
  if (props.mobileToggle) {
    return [
      'fixed left-3 right-3 bottom-24 w-auto',
      'max-h-[calc(100dvh-7.5rem)]',
    ].join(' ')
  }

  if (props.railMode && !props.chromeMinimized) {
    return [
      'fixed inset-x-3 bottom-36 w-auto max-h-[calc(100dvh-9.75rem)]',
      'md:absolute md:inset-x-auto md:bottom-0 md:right-[calc(100%+1rem)]',
      'md:w-[min(30rem,calc(100vw-9.5rem))] md:max-h-[min(38rem,calc(100dvh-2rem))]',
      'xl:w-[28rem]',
    ].join(' ')
  }

  return [
    'fixed inset-x-3 bottom-36 w-auto max-h-[calc(100dvh-9.75rem)]',
    'sm:absolute sm:inset-x-auto sm:bottom-[calc(100%+1rem)] sm:right-0',
    'sm:w-[min(calc(100vw-1.5rem),30rem)] sm:max-h-[min(38rem,calc(100dvh-2rem))]',
    'xl:w-[28rem]',
  ].join(' ')
})

const bubbleFrameClass = computed(() => {
  if (props.mobileToggle) {
    return 'bottom-[calc(100%+0.5rem)] left-0'
  }

  if (props.railMode && !props.chromeMinimized) {
    return [
      'bottom-[calc(100%+0.75rem)] right-0',
      'md:bottom-6 md:right-[calc(100%+0.75rem)]',
    ].join(' ')
  }

  return 'bottom-[calc(100%+0.75rem)] right-0'
})

const activeDream = computed(() => {
  return (dreamStore.selectedDream as DreamWithNarrator | null) ?? null
})

const dreamNarrators = computed(() => {
  return activeDream.value?.Bots ?? []
})

const dreamScenarios = computed<DreamScenario[]>(() => {
  return activeDream.value?.Scenarios ?? []
})

const selectedScenario = computed<DreamScenario | null>(() => {
  const scenarios = dreamScenarios.value

  if (!scenarios.length) return null

  const match = scenarios.find(
    (scenario, index) =>
      scenarioKey(scenario, index) === selectedScenarioKey.value,
  )
  const firstScenario = scenarios[0]

  return match ?? firstScenario ?? null
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
  return cleanPublicNarratorText(
    narratorBot.value?.subtitle ||
      narratorBot.value?.tagline ||
      narratorBot.value?.description ||
      narratorBot.value?.personality ||
      'Dream guide, scene starter, and chaos translator.',
  )
})

const narratorMenuSummary = computed(() => {
  return cleanPublicNarratorText(
    narratorBot.value?.subtitle ||
      narratorBot.value?.tagline ||
      narratorBot.value?.description ||
      'A Dream-facing guide for building elements, starting scenes, and adding flavor.',
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

  return `Ask ${narratorName.value} about ${
    activeDream.value.title || 'this Dream'
  }...`
})

const fallbackNavigationEntries = computed<FallbackNavigationEntry[]>(() => [
  {
    key: 'dreams',
    title: 'Pick a Dream',
    description:
      'Start with a vibe, then the narrator can help turn it into scenes and choices.',
    badge: 'Dreams',
    icon: 'kind-icon:dream',
    tab: 'gallery',
  },
  {
    key: 'builder',
    title: 'Build Something',
    description:
      'Open the maker space when you want new pieces, expansions, and weird little sparks.',
    badge: 'Maker',
    icon: 'kind-icon:wand',
    tab: 'dreammaker',
  },
  {
    key: 'interact',
    title: 'Play a Scene',
    description:
      'Jump into interact mode when a Dream is ready to become a tiny living story.',
    badge: 'Play',
    icon: 'kind-icon:book',
    tab: 'interact',
  },
])

watch(
  () => activeDream.value?.id,
  async () => {
    narratorSessionIds.value = []
    narratorMessage.value = ''
    statusMessage.value = ''
    selectedScenarioKey.value = ''
    showMoodRing.value = false
    setEmotion('NEUTRAL', false)

    await nextTick()

    selectFirstScenario()

    if (bubblesEnabled.value) {
      showBubbleForEmotion('NEUTRAL')
    }
  },
)

watch(
  () =>
    dreamScenarios.value
      .map((scenario, index) => scenarioKey(scenario, index))
      .join('|'),
  () => {
    selectFirstScenario()
  },
)

watch(
  () => narratorSession.value.map((chat) => chat.botResponse).join(''),
  async () => {
    await nextTick()
    scrollChatToBottom()
  },
)

watch([isOpen, pinOpen, bubblesEnabled, activeScreen], saveSettings)

watch(
  isOpen,
  (value) => {
    emit('panel-open-change', value)
  },
  { immediate: true },
)

onMounted(async () => {
  loadSettings()

  await Promise.all([
    dreamStore.initialize({ fetchRemote: true }),
    chatStore.initialize(),
    ...(serverStore.hasLoaded
      ? []
      : [serverStore.initialize({ fetchRemote: true })]),
  ])

  selectFirstScenario()

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

function screenButtonClass(screen: NarratorScreen) {
  return activeScreen.value === screen
    ? 'btn-primary text-white'
    : 'btn-ghost bg-base-100/70'
}

function setScreen(screen: NarratorScreen) {
  activeScreen.value = screen
}

function setEmotion(emotion: NarratorEmotion, showBubble = true) {
  currentEmotion.value = emotion

  if (showBubble) {
    showBubbleForEmotion(emotion)
  }
}

function cycleEmotion() {
  showMoodRing.value = true

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
    clearBubble()
  } else {
    showBubbleForEmotion(currentEmotion.value)
  }
}

function closePanel() {
  isOpen.value = false

  if (bubblesEnabled.value) {
    showBubbleForEmotion(currentEmotion.value)
  }
}

function togglePin() {
  pinOpen.value = !pinOpen.value

  if (pinOpen.value) {
    isOpen.value = true
    clearBubble()
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
      activeScreen?: NarratorScreen
    }

    pinOpen.value = Boolean(parsed.pinOpen)
    isOpen.value = Boolean(parsed.isOpen || parsed.pinOpen)
    bubblesEnabled.value = parsed.bubblesEnabled !== false
    currentEmotion.value = normalizeEmotion(parsed.currentEmotion)

    if (
      parsed.activeScreen === 'narrator' ||
      parsed.activeScreen === 'scenarios'
    ) {
      activeScreen.value = parsed.activeScreen
    }
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
        activeScreen: activeScreen.value,
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
  if (!bubblesEnabled.value || isOpen.value) return

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

function scenarioKey(scenario: DreamScenario, index = 0) {
  return String(
    scenario.id ??
      scenario.slug ??
      scenario.title ??
      scenario.name ??
      `scenario-${index}`,
  )
}

function selectFirstScenario() {
  const scenarios = dreamScenarios.value
  const firstScenario = scenarios[0]

  if (!firstScenario) {
    selectedScenarioKey.value = ''
    return
  }

  const currentExists = scenarios.some(
    (scenario, index) =>
      scenarioKey(scenario, index) === selectedScenarioKey.value,
  )

  if (!currentExists) {
    selectedScenarioKey.value = scenarioKey(firstScenario, 0)
  }
}

function selectScenario(scenario: DreamScenario, index = 0) {
  selectedScenarioKey.value = scenarioKey(scenario, index)
}

function scenarioButtonClass(scenario: DreamScenario, index = 0) {
  return scenarioKey(scenario, index) === selectedScenarioKey.value
    ? 'border-primary/50 bg-primary/10'
    : 'border-base-300 hover:bg-base-200'
}

function scenarioTitle(scenario?: DreamScenario | null) {
  return scenario?.title || scenario?.name || 'Untitled Scenario'
}

function scenarioSummary(scenario?: DreamScenario | null) {
  if (!scenario) return 'No scenario selected.'

  return (
    scenario.summary ||
    scenario.pitch ||
    scenario.description ||
    scenario.flavorText ||
    scenario.artPrompt ||
    'No summary yet. Mysterious, but legally still a scenario.'
  )
}

function scenarioImage(scenario?: DreamScenario | null) {
  if (!scenario) return ''

  const collectionImage = scenario.ArtCollection?.ArtImages?.[0]

  return (
    scenario.imagePath ||
    scenario.highlightImage ||
    scenario.ArtImage?.imagePath ||
    scenario.ArtImage?.path ||
    scenario.ArtImage?.fileName ||
    collectionImage?.imagePath ||
    collectionImage?.path ||
    collectionImage?.fileName ||
    ''
  )
}

function cleanPublicNarratorText(value: unknown) {
  const text = String(value || '').trim()

  if (!text) return ''

  const instructionPatterns = [
    /^you are\b/i,
    /^act as\b/i,
    /^system:/i,
    /^assistant:/i,
    /^your role\b/i,
  ]

  if (instructionPatterns.some((pattern) => pattern.test(text))) {
    return 'Dream guide, scene starter, and chaos translator.'
  }

  return text
}

function openFallbackEntry(entry: FallbackNavigationEntry) {
  navStore.setDashboardTab(
    'dream',
    entry.tab,
    `workspace narrator ${entry.key}`,
  )
  activeScreen.value = 'scenarios'
  isOpen.value = true
}

function prepareBuildPrompt() {
  if (!activeDream.value) {
    activeScreen.value = 'scenarios'
    isOpen.value = true
    return
  }

  navStore.setDashboardTab('dream', 'dreammaker', 'workspace narrator build')
  activeScreen.value = 'narrator'
  isOpen.value = true
  clearBubble()
  setEmotion('EXCITED')

  narratorMessage.value = [
    `Help me expand the Dream "${activeDream.value.title}".`,
    'Suggest one character, one scenario/location, one related Dream, and one art direction.',
    'Keep it punchy and immediately usable.',
  ].join('\n')
}

function prepareStoryPrompt() {
  if (!activeDream.value) {
    activeScreen.value = 'scenarios'
    isOpen.value = true
    return
  }

  navStore.setDashboardTab('dream', 'interact', 'workspace narrator story')
  activeScreen.value = 'narrator'
  isOpen.value = true
  clearBubble()
  setEmotion('PROUD')

  narratorMessage.value = [
    `Start an interactive opening scene for the Dream "${activeDream.value.title}".`,
    'Use the connected characters and scenarios if they exist.',
    'End with 2 or 3 choices for the user.',
  ].join('\n')
}

function prepareScenarioSeedPrompt() {
  if (!activeDream.value) {
    activeScreen.value = 'scenarios'
    isOpen.value = true
    return
  }

  navStore.setDashboardTab(
    'dream',
    'dreammaker',
    'workspace narrator scenario seed',
  )
  activeScreen.value = 'narrator'
  isOpen.value = true
  clearBubble()
  setEmotion('EXCITED')

  narratorMessage.value = [
    `Create 3 scenario options for the Dream "${activeDream.value.title}".`,
    'Each scenario should include a title, a playable location, a central tension, and one visual hook.',
    'Make them distinct, immediately usable, and weird in a good way.',
  ].join('\n')
}

function prepareScenarioStoryPrompt() {
  const dream = activeDream.value
  const scenario = selectedScenario.value

  if (!dream || !scenario) return

  navStore.setDashboardTab(
    'dream',
    'interact',
    'workspace narrator scenario play',
  )
  activeScreen.value = 'narrator'
  isOpen.value = true
  clearBubble()
  setEmotion('PROUD')

  narratorMessage.value = [
    `Start an interactive scene for the Dream "${dream.title}".`,
    `Scenario: ${scenarioTitle(scenario)}`,
    scenarioSummary(scenario),
    'Use a vivid opening beat and end with 2 or 3 choices.',
  ]
    .filter(Boolean)
    .join('\n')
}

function prepareScenarioBuildPrompt() {
  const dream = activeDream.value
  const scenario = selectedScenario.value

  if (!dream || !scenario) return

  navStore.setDashboardTab(
    'dream',
    'dreammaker',
    'workspace narrator scenario remix',
  )
  activeScreen.value = 'narrator'
  isOpen.value = true
  clearBubble()
  setEmotion('EXCITED')

  narratorMessage.value = [
    `Remix and expand this scenario for the Dream "${dream.title}".`,
    `Scenario: ${scenarioTitle(scenario)}`,
    scenarioSummary(scenario),
    'Give me one stronger conflict, one strange NPC or character seed, one environmental twist, and one art direction.',
  ]
    .filter(Boolean)
    .join('\n')
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
            ? `Scenarios: ${dream.Scenarios.map((scenario) =>
                scenarioTitle(scenario),
              )
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
    selectedScenario.value
      ? [
          `Selected scenario: ${scenarioTitle(selectedScenario.value)}`,
          scenarioSummary(selectedScenario.value),
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

    if (!newChat?.id) {
      throw new Error('Failed to create Narrator message.')
    }

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
</script>

<style scoped>
.narrator-speech::after {
  position: absolute;
  right: -0.45rem;
  bottom: 1.5rem;
  height: 0.9rem;
  width: 0.9rem;
  transform: rotate(45deg);
  border-top: 2px solid color-mix(in srgb, currentColor 20%, transparent);
  border-right: 2px solid color-mix(in srgb, currentColor 20%, transparent);
  background: color-mix(
    in srgb,
    var(--fallback-b1, oklch(var(--b1))) 95%,
    transparent
  );
  content: '';
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
.narrator-bubble-enter-active,
.narrator-bubble-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.narrator-panel-enter-from,
.narrator-panel-leave-to {
  opacity: 0;
  transform: translateX(1rem) translateY(0.5rem) scale(0.98);
}

.narrator-bubble-enter-from,
.narrator-bubble-leave-to {
  opacity: 0;
  transform: translateX(0.75rem) scale(0.98);
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
