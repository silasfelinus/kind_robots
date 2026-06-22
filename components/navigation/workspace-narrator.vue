<template>
  <div
    v-if="narratorDockVisible"
    class="pointer-events-none h-full w-full overflow-visible"
  >
    <Transition name="narrator-panel">
      <section
        v-if="isOpen"
        class="pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-[100vw] min-w-0 flex-col overflow-hidden rounded-2xl border border-primary/25 bg-base-100/95 shadow-2xl backdrop-blur-xl sm:rounded-3xl"
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
                :class="portraitFlipping ? 'is-portrait-flipping' : ''"
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
                  <h2
                    class="truncate text-base font-black text-base-content lg:text-base xl:text-lg"
                  >
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
                @click="closePanel()"
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

        <section class="shrink-0 border-b border-base-300 bg-base-200/45 p-3">
          <button
            type="button"
            class="group relative flex h-[min(34dvh,16rem)] w-full items-center justify-center overflow-hidden rounded-3xl border border-primary/20 bg-base-100/70 shadow-inner"
            :aria-label="`Play ${narratorName} reaction`"
            @click="playReactionOnClick"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-80"
            />

            <img
              v-if="narratorVideo"
              :src="narratorVideo"
              :alt="narratorName"
              class="relative z-10 h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />

            <img
              v-else
              :src="narratorImage"
              :alt="narratorName"
              class="relative z-10 h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </button>
        </section>

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
              v-if="!narratorSession.length"
              class="rounded-3xl border border-primary/20 bg-primary/5 p-3"
            >
              <div class="flex items-start gap-3">
                <img
                  :src="narratorImage"
                  :alt="narratorName"
                  class="h-10 w-10 shrink-0 rounded-2xl border border-primary/30 bg-base-300 object-cover shadow"
                  loading="lazy"
                />

                <div class="min-w-0 flex-1">
                  <p
                    class="text-xs font-black uppercase tracking-wide text-primary"
                  >
                    {{ narratorName }}
                  </p>

                  <p
                    class="mt-1 text-sm leading-relaxed text-base-content/75 md:text-base lg:text-lg xl:text-xl"
                  >
                    {{ narratorIntro }}
                  </p>
                </div>
              </div>

              <div class="mt-3 grid gap-2">
                <button
                  v-for="starter in narratorStarterPrompts"
                  :key="starter.key"
                  type="button"
                  class="group flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                  @click="applyStarterPrompt(starter)"
                >
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"
                  >
                    <Icon :name="starter.icon" class="h-5 w-5" />
                  </span>

                  <span class="min-w-0 flex-1">
                    <span
                      class="block text-sm font-black text-base-content md:text-base lg:text-lg xl:text-xl"
                    >
                      {{ starter.title }}
                    </span>

                    <span
                      class="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-base-content/60 md:text-sm lg:text-base xl:text-lg"
                    >
                      {{ starter.description }}
                    </span>
                  </span>

                  <Icon
                    name="kind-icon:chevron-right"
                    class="h-4 w-4 shrink-0 text-base-content/35 transition group-hover:text-primary"
                  />
                </button>
              </div>
            </section>

            <section
              v-if="showMoodRing && emotionOptions.length"
              class="mt-3 overflow-hidden rounded-3xl border border-primary/25 bg-base-200/70 shadow-lg"
            >
              <div
                class="flex items-center justify-between gap-2 border-b border-base-300/70 bg-base-100/60 px-3 py-2"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="flex h-6 w-6 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary"
                  >
                    <Icon name="kind-icon:dream" class="h-3.5 w-3.5" />
                  </span>

                  <p
                    class="text-xs font-black uppercase tracking-wide text-primary"
                  >
                    Mood Ring
                  </p>
                </div>

                <span class="badge badge-outline badge-sm rounded-xl">
                  {{ currentEmotionLabel }}
                </span>
              </div>

              <div class="bg-base-100/40 p-3">
                <div class="flex flex-wrap gap-2">
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
              </div>
            </section>

            <section
              v-if="narratorSession.length"
              class="mt-3 overflow-hidden rounded-3xl border border-primary/25 bg-base-200/70 shadow-lg"
            >
              <div
                class="flex items-center justify-between gap-2 border-b border-base-300/70 bg-base-100/60 px-3 py-2"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="flex h-6 w-6 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary"
                  >
                    <Icon name="kind-icon:message" class="h-3.5 w-3.5" />
                  </span>

                  <p
                    class="text-xs font-black uppercase tracking-wide text-primary"
                  >
                    Narrator Session
                  </p>
                </div>

                <button
                  type="button"
                  class="btn btn-ghost btn-xs rounded-xl"
                  :disabled="isNarratorResponding"
                  @click="clearSession"
                >
                  Clear
                </button>
              </div>

              <div
                ref="chatLogRef"
                class="max-h-64 overflow-y-auto overscroll-contain bg-base-200/40 p-3 sm:max-h-72"
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
                      <p class="whitespace-pre-wrap">
                        {{ chat.content }}
                      </p>
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
                v-for="starter in narratorStarterPrompts"
                :key="starter.key"
                type="button"
                class="group flex items-center gap-3 rounded-[1.35rem] border border-base-300 bg-base-100 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                @click="applyStarterPrompt(starter)"
              >
                <span
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"
                >
                  <Icon :name="starter.icon" class="h-5 w-5" />
                </span>

                <span class="min-w-0 flex-1">
                  <span class="block font-black text-base-content">
                    {{ starter.title }}
                  </span>

                  <span
                    class="mt-0.5 line-clamp-2 block text-sm leading-relaxed text-base-content/65"
                  >
                    {{ starter.description }}
                  </span>
                </span>

                <span class="badge badge-outline rounded-xl">
                  {{ starter.path || 'Guide' }}
                </span>
              </button>
            </section>
          </section>
        </div>
      </section>
    </Transition>

    <Transition name="narrator-circle">
      <button
        v-if="!isOpen"
        type="button"
        class="narrator-dock group pointer-events-auto absolute bottom-3 right-3 z-110 overflow-hidden rounded-3xl border-2 border-primary/40 bg-base-300/90 shadow-2xl transition-transform duration-300 hover:scale-105 md:rounded-full"
        :class="portraitFlipping ? 'is-portrait-flipping' : ''"
        :aria-expanded="isOpen"
        :aria-label="`Open ${narratorName}`"
        :title="narratorHoverTitle"
        @click="openPanelFromDock"
      >
        <div
          class="absolute -inset-1 rounded-full bg-primary/20 opacity-0 blur-xl transition group-hover:opacity-100"
        />

        <img
          v-if="narratorVideo"
          :src="narratorVideo"
          :alt="narratorName"
          class="narrator-dock-img relative h-full w-full cursor-pointer p-1"
          loading="lazy"
          @dblclick.stop="playReactionOnClick"
        />

        <img
          v-else
          :src="narratorImage"
          :alt="narratorName"
          class="narrator-dock-img relative h-full w-full cursor-pointer p-1"
          loading="lazy"
          @dblclick.stop="playReactionOnClick"
        />

        <span
          v-if="currentEmotionRow?.emoticon"
          class="absolute -right-0.5 -top-0.5 rounded-full border border-base-300 bg-base-100 px-1 py-0.5 text-xs shadow"
        >
          {{ currentEmotionRow.emoticon }}
        </span>
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  emotionLabel,
  scenarioImage,
  scenarioKey,
  scenarioSummary,
  scenarioTitle,
  type NarratorEmotion,
  type NarratorScreen,
} from '@/stores/helpers/narratorHelper'
import { useNarratorStore } from '@/stores/narratorStore'

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
  activeScreen,
  selectedScenarioKey,
  showMoodRing,
  narratorMessage,
  statusMessage,
  statusTone,
  shouldRender,
  activeDream,
  dreamScenarios,
  selectedScenario,
  emotionOptions,
  currentEmotionRow,
  narratorName,
  narratorMenuSummary,
  narratorHoverTitle,
  narratorImage,
  narratorVideo,
  currentEmotionLabel,
  activeDreamSummary,
  narratorIntro,
  narratorStarterPrompts,
  narratorSession,
  isNarratorResponding,
  canUseNarrator,
  canSendNarrator,
  narratorPlaceholder,
} = storeToRefs(narratorStore)

const chatLogRef = ref<HTMLElement | null>(null)

const narratorDockVisible = computed(() => {
  return Boolean(shouldRender.value || narratorImage.value || narratorVideo.value)
})

const portraitFlipping = ref(false)
const PORTRAIT_FLIP_MS = 650
let portraitFlipTimer: ReturnType<typeof setTimeout> | null = null

function triggerPortraitFlip(): void {
  if (portraitFlipTimer) clearTimeout(portraitFlipTimer)

  portraitFlipping.value = true

  portraitFlipTimer = setTimeout(() => {
    portraitFlipping.value = false
    portraitFlipTimer = null
  }, PORTRAIT_FLIP_MS)
}

watch(
  () => [narratorImage.value, narratorVideo.value],
  ([nextImage, nextVideo], [prevImage, prevVideo]) => {
    if (nextImage !== prevImage || nextVideo !== prevVideo) {
      triggerPortraitFlip()
    }
  },
)

const {
  initialize,
  disposeTimers,
  togglePanel,
  closePanel,
  togglePin,
  setScreen,
  setEmotion,
  selectScenario,
  scenarioButtonClass,
  applyStarterPrompt,
  prepareBuildPrompt,
  prepareStoryPrompt,
  prepareScenarioSeedPrompt,
  prepareScenarioStoryPrompt,
  prepareScenarioBuildPrompt,
  clearSession,
  sendNarratorMessage,
  playReactionOnClick,
  teardownLiveness,
} = narratorStore

watch(
  () => props.open,
  (value) => {
    if (value && !isOpen.value) {
      togglePanel()
    } else if (!value && isOpen.value) {
      closePanel(false)
    }
  },
  { immediate: true },
)

watch(isOpen, (value) => {
  if (value !== props.open) {
    emit('update:open', value)
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
  () => narratorSession.value.map((chat) => chat.botResponse).join(''),
  async () => {
    await nextTick()
    scrollChatToBottom()
  },
)

onMounted(async () => {
  await initialize()
})

onBeforeUnmount(() => {
  disposeTimers()
  teardownLiveness()

  if (portraitFlipTimer) clearTimeout(portraitFlipTimer)
})

function openPanelFromDock(): void {
  if (!isOpen.value) togglePanel()
}

function screenButtonClass(screen: NarratorScreen) {
  return activeScreen.value === screen
    ? 'btn-primary text-white'
    : 'btn-ghost bg-base-100/70'
}

function emotionButtonClass(emotion: NarratorEmotion) {
  return narratorStore.currentEmotion === emotion ? 'btn-primary text-white' : 'btn-outline'
}

function scrollChatToBottom(): void {
  const element = chatLogRef.value
  if (!element) return

  element.scrollTop = element.scrollHeight
}
</script>

<style scoped>
.narrator-dock {
  height: min(32dvh, 12rem);
  width: var(--narrator-circle);
}

.narrator-dock-img {
  object-fit: contain;
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

.narrator-console-dot {
  display: inline-block;
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 9999px;
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

.is-portrait-flipping {
  animation: narrator-portrait-spin 650ms cubic-bezier(0.4, 0.1, 0.2, 1);
  transform-style: preserve-3d;
}

@keyframes narrator-portrait-spin {
  0% {
    transform: rotateY(0deg) scale(1);
  }

  50% {
    transform: rotateY(180deg) scale(1.06);
  }

  100% {
    transform: rotateY(360deg) scale(1);
  }
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

.narrator-circle-enter-active,
.narrator-circle-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.narrator-circle-enter-from,
.narrator-circle-leave-to {
  opacity: 0;
  transform: scale(0.6) translateY(0.5rem);
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

@media (prefers-reduced-motion: reduce) {
  .is-portrait-flipping {
    animation: none;
  }

  .narrator-panel-enter-active,
  .narrator-panel-leave-active,
  .narrator-bubble-enter-active,
  .narrator-bubble-leave-active,
  .narrator-circle-enter-active,
  .narrator-circle-leave-active {
    transition: none;
  }
}
</style>