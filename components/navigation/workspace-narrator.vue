<template>
  <div
    v-if="shouldRender"
    class="pointer-events-none z-100 overflow-visible"
    :class="narratorFrameClass"
  >
    <Transition name="narrator-bubble">
      <aside
        v-if="activeBubble && bubblesEnabled && !isOpen"
        class="narrator-speech pointer-events-auto absolute z-120 w-[min(calc(100vw-1.5rem),20rem)] rounded-[1.75rem] border-2 border-primary/30 bg-base-100/95 p-3 text-sm md:text-md lg:text-lg xl:text-xl leading-relaxed text-base-content shadow-2xl backdrop-blur"
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
                  <h2
                    class="truncate text-base lg:text-md xl:text-lg font-black text-base-content"
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
                    class="mt-1 text-sm md:text-md lg:text-lg xl:text-xl leading-relaxed text-base-content/75"
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
                      class="block text-sm md:text-md lg:text-lg xl:text-xl font-black text-base-content"
                    >
                      {{ starter.title }}
                    </span>

                    <span
                      class="mt-0.5 line-clamp-2 block text-xs md:text-sm lg:text-md xl:text-lg leading-relaxed text-base-content/60"
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
              class="mt-3 rounded-3xl border border-base-300 bg-base-200/80 p-3"
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

    <section
      class="pointer-events-auto relative z-100 h-full w-full overflow-visible"
    >
      <button
        v-if="!mobileToggle"
        type="button"
        class="group relative h-full w-full overflow-hidden rounded-4xl border border-primary/30 bg-base-300 shadow-2xl transition-transform duration-300 hover:scale-105 md:rounded-[2.5rem]"
        :aria-expanded="isOpen"
        :title="narratorHoverTitle"
        @click="togglePanel"
      >
        <div
          class="absolute -inset-1 rounded-[2.75rem] bg-primary/20 opacity-0 blur-xl transition group-hover:opacity-100"
        />

        <!-- Reaction loop (animated webp) while playing, else the still portrait.
             Clicking the portrait plays a reaction without toggling the panel. -->
        <img
          v-if="narratorVideo"
          :src="narratorVideo"
          :alt="narratorName"
          class="relative h-full w-full cursor-pointer object-cover"
          loading="lazy"
          @click.stop="playReactionOnClick"
        />
        <img
          v-else
          :src="narratorImage"
          :alt="narratorName"
          class="relative h-full w-full cursor-pointer object-cover"
          loading="lazy"
          @click.stop="playReactionOnClick"
        />

        <div
          class="absolute inset-x-0 bottom-0 bg-linear-to-t from-base-100 via-base-100/75 to-transparent px-2 pb-2 pt-8 text-center"
        >
          <div
            class="mx-auto max-w-[92%] rounded-full border border-base-300/80 bg-base-100/90 px-3 py-1.5 shadow-xl backdrop-blur"
          >
            <p
              class="truncate text-sm font-black leading-tight text-primary md:text-base"
            >
              {{ narratorName }}
            </p>
          </div>
        </div>

        <span
          v-if="currentEmotionRow?.emoticon"
          class="absolute right-2 top-2 rounded-full border border-base-300 bg-base-100 px-2 py-1 text-base shadow md:text-lg"
        >
          {{ currentEmotionRow.emoticon }}
        </span>
      </button>

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

const emit = defineEmits<{
  'panel-open-change': [value: boolean]
}>()

const narratorStore = useNarratorStore()

const {
  isOpen,
  pinOpen,
  bubblesEnabled,
  activeScreen,
  selectedScenarioKey,
  showMoodRing,
  activeBubble,
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
  fallbackEmotionIcon,
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

const mobileToggle = computed(() => props.mobileToggle)

const narratorFrameClass = computed(() => {
  if (props.mobileToggle) {
    return 'relative h-12 w-12 transition-transform duration-300 ease-out'
  }

  if (props.railMode && !props.chromeMinimized) {
    return [
      'fixed bottom-3 right-3 h-36 w-24 max-w-[calc(100vw-1.5rem)]',
      'transition-[height,width,transform] duration-300 ease-out',
      isOpen.value ? 'h-40 w-28' : '',
      'md:relative md:bottom-auto md:right-auto',
      'md:h-[calc(var(--hand-h,9rem)*2.05)] md:w-[calc(var(--hand-h,9rem)*0.86)]',
      'md:max-h-[76dvh] md:min-h-52 md:min-w-28 md:max-w-none',
      isOpen.value
        ? 'md:h-[calc(var(--hand-h,9rem)*2.55)] md:w-[calc(var(--hand-h,9rem)*1.08)]'
        : 'md:hover:h-[calc(var(--hand-h,9rem)*2.65)] md:hover:w-[calc(var(--hand-h,9rem)*1.12)]',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return [
    'fixed bottom-3 right-3 h-36 w-24 max-w-[calc(100vw-1.5rem)]',
    'transition-[height,width,transform] duration-300 ease-out',
    isOpen.value ? 'h-40 w-28' : '',
    'sm:bottom-4 sm:right-4',
    'md:h-[calc(var(--hand-h,9rem)*1.85)] md:w-[calc(var(--hand-h,9rem)*0.78)]',
    'md:max-h-[72dvh] md:min-h-48 md:min-w-28 md:max-w-none',
    isOpen.value
      ? 'md:h-[calc(var(--hand-h,9rem)*2.35)] md:w-[calc(var(--hand-h,9rem)*1)]'
      : 'md:hover:h-[calc(var(--hand-h,9rem)*2.45)] md:hover:w-[calc(var(--hand-h,9rem)*1.04)]',
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

const {
  initialize,
  disposeTimers,
  clearBubble,
  togglePanel,
  closePanel,
  togglePin,
  toggleBubbles,
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
  () => props.closeSignal,
  () => {
    closePanel(false)
  },
)

watch(
  isOpen,
  (value) => {
    emit('panel-open-change', value)
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
})

function screenButtonClass(screen: NarratorScreen) {
  return activeScreen.value === screen
    ? 'btn-primary text-white'
    : 'btn-ghost bg-base-100/70'
}

function emotionButtonClass(emotion: NarratorEmotion) {
  return narratorStore.currentEmotion === emotion
    ? 'btn-primary text-white'
    : 'btn-outline'
}

function scrollChatToBottom() {
  const element = chatLogRef.value
  if (!element) return

  element.scrollTop = element.scrollHeight
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
