<!-- /components/content/weird/scenario-interact.vue -->
<!--
  Pure view over storyStore + scenarioStore.
  storyStore.phase drives everything:
    browse    → gallery grid; tapping a card selects in the store
    configure → full scenario summary, starter choices, configurables
    story     → the running narrative
  No emits, no cross-component watchers — selection in scenario-card
  writes to scenarioStore, and this template reacts.
-->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3">
    <!-- Status toast -->
    <div
      v-if="storyStore.statusMessage"
      class="shrink-0 rounded-2xl border p-3 text-sm"
      :class="
        storyStore.statusTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      {{ storyStore.statusMessage }}
    </div>

    <!-- ==================================================== -->
    <!-- PHASE 1: BROWSE                                      -->
    <!-- ==================================================== -->
    <scenario-gallery
      v-if="storyStore.phase === 'browse'"
      class="min-h-0 flex-1"
      variant="grid"
      title="Choose Your Scenario"
      subtitle="Tap a world to read it, configure it, and launch a story."
      :show-inspirations="false"
    />

    <!-- ==================================================== -->
    <!-- PHASE 2: CONFIGURE                                   -->
    <!-- ==================================================== -->
    <section
      v-else-if="storyStore.phase === 'configure'"
      class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain"
    >
      <!-- Slim header: the full intro (image + description) lives in the
           workspace sheet, which auto-opened on selection -->
      <div
        class="flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-100 p-2 pl-1 shadow-sm"
      >
        <div class="flex min-w-0 items-center gap-1">
          <button
            class="btn btn-ghost btn-sm gap-1.5 rounded-xl"
            type="button"
            @click="storyStore.backToBrowse"
          >
            <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
            <span class="hidden sm:inline">All Scenarios</span>
          </button>

          <div class="min-w-0">
            <h1
              class="truncate text-lg font-black leading-tight text-base-content"
            >
              {{ selectedScenarioTitle }}
            </h1>

            <p
              v-if="selectedScenario?.genres"
              class="truncate text-xs text-base-content/60"
            >
              {{ selectedScenario.genres }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <span
            v-if="selectedScenario?.isMature"
            class="badge badge-warning badge-sm"
          >
            Mature
          </span>

          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            title="Show or hide scenario details"
            @click="sheetStore.toggleSheet"
          >
            <Icon name="kind-icon:info" class="h-4 w-4" />
            <span class="hidden sm:inline">Info</span>
          </button>
        </div>
      </div>

      <!-- Starter choices -->
      <article
        v-if="introChoices.length"
        class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
      >
        <h2 class="text-lg font-black text-base-content">How does it begin?</h2>

        <p class="mt-0.5 text-sm text-base-content/60">
          Pick an opening, or write your own direction below.
        </p>

        <div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <button
            v-for="(intro, index) in introChoices"
            :key="`${intro.label}-${index}`"
            type="button"
            class="group flex flex-col gap-1 rounded-2xl border p-4 text-left transition"
            :class="
              scenarioStore.currentChoice === intro.raw
                ? 'border-primary bg-primary/10 ring-2 ring-primary'
                : 'border-base-300 bg-base-200 hover:border-primary/40 hover:bg-base-200/60'
            "
            @click="storyStore.pickIntro(intro.raw)"
          >
            <span
              v-if="intro.label"
              class="text-xs font-black uppercase tracking-widest"
              :class="
                scenarioStore.currentChoice === intro.raw
                  ? 'text-primary'
                  : 'text-primary/70 group-hover:text-primary'
              "
            >
              {{ intro.label }}
            </span>

            <span class="text-sm leading-relaxed text-base-content/80">
              {{ intro.body }}
            </span>
          </button>
        </div>
      </article>

      <!-- Configurables -->
      <article
        class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
      >
        <h2 class="text-lg font-black text-base-content">Configure</h2>

        <div class="mt-3 flex flex-col gap-4">
          <section>
            <div class="mb-2 flex items-center justify-between gap-2">
              <p
                class="text-xs font-bold uppercase tracking-wider text-base-content/50"
              >
                Character <span class="text-error">*</span>
              </p>

              <p class="truncate text-sm font-semibold text-base-content">
                {{ selectedCharacterTitle }}
              </p>
            </div>

            <character-gallery
              variant="row"
              :show-header="false"
              :show-controls="false"
              :show-card-actions="false"
              :compact="true"
            />
          </section>

          <section>
            <div class="mb-2 flex items-center justify-between gap-2">
              <p
                class="text-xs font-bold uppercase tracking-wider text-base-content/50"
              >
                Reward (optional)
              </p>

              <button
                v-if="rewardStore.selectedReward"
                class="btn btn-ghost btn-xs rounded-xl"
                type="button"
                @click="rewardStore.deselectReward()"
              >
                <Icon name="kind-icon:x" class="h-3 w-3" />
                {{ selectedRewardTitle }}
              </button>

              <p v-else class="text-sm text-base-content/50">None selected</p>
            </div>

            <reward-gallery
              variant="row"
              :show-header="false"
              :show-controls="false"
              :show-card-actions="false"
              :compact="true"
            />
          </section>

          <label class="form-control">
            <span class="label">
              <span class="label-text font-bold">Custom direction</span>

              <span class="label-text-alt text-base-content/50">Optional</span>
            </span>

            <textarea
              :value="storyStore.customDirection"
              class="textarea textarea-bordered min-h-20 w-full resize-none rounded-2xl bg-base-200"
              placeholder="Add a tone, goal, complication, skill check, inventory item, or narrative twist..."
              :disabled="storyStore.isBusy"
              @input="
                storyStore.setCustomDirection(
                  ($event.target as HTMLTextAreaElement).value,
                )
              "
            />
          </label>
        </div>
      </article>

      <!-- Launch -->
      <div class="shrink-0 pb-2">
        <button
          class="btn btn-success min-h-14 w-full rounded-2xl text-base"
          type="button"
          :disabled="!storyStore.canStartStory"
          @click="storyStore.submitStoryTurn"
        >
          <span
            v-if="storyStore.isBusy"
            class="loading loading-spinner loading-sm"
          />
          <Icon v-else name="kind-icon:play" class="h-5 w-5" />
          {{ storyStore.isBusy ? 'Story goblin thinking...' : 'Start Story' }}
        </button>

        <p
          v-if="!characterStore.selectedCharacter"
          class="mt-2 text-center text-sm text-base-content/60"
        >
          Pick a character above to launch.
        </p>

        <div class="mt-2 flex items-center justify-between gap-2 px-1">
          <button
            class="btn btn-ghost btn-xs rounded-xl"
            type="button"
            :disabled="!storyStore.storyPromptPreview"
            @click="copyPrompt"
          >
            Copy Full Prompt
          </button>

          <span class="text-xs text-base-content/50">
            {{ activeServerName }}
          </span>
        </div>
      </div>
    </section>

    <!-- ==================================================== -->
    <!-- PHASE 3: STORY                                       -->
    <!-- ==================================================== -->
    <section
      v-else
      class="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    >
      <!-- Context bar -->
      <header
        class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100 p-3"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-300"
          >
            <img
              :src="selectedScenarioImage"
              :alt="selectedScenarioTitle"
              class="h-full w-full object-cover"
            />
          </div>

          <div class="min-w-0">
            <h2 class="truncate text-base font-black text-base-content">
              {{ selectedScenarioTitle }}
            </h2>

            <p class="truncate text-xs text-base-content/60">
              {{ selectedCharacterTitle }}
              <template v-if="rewardStore.selectedReward">
                · {{ selectedRewardTitle }}
              </template>
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="storyStore.isBusy"
            title="Start over with the same scenario"
            @click="storyStore.newStory"
          >
            <Icon name="kind-icon:refresh" class="h-4 w-4" />
            <span class="hidden sm:inline">New Story</span>
          </button>

          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="storyStore.isBusy"
            title="End the story and browse scenarios"
            @click="storyStore.endSession"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
            <span class="hidden sm:inline">End</span>
          </button>
        </div>
      </header>

      <!-- Story log -->
      <section
        ref="storyLogRef"
        class="min-h-0 overflow-y-auto overscroll-contain bg-base-200 p-4"
      >
        <div class="mx-auto flex max-w-3xl flex-col gap-4">
          <article
            v-for="chat in storyStore.sessionChats"
            :key="chat.id"
            class="flex flex-col gap-3"
          >
            <div class="flex flex-row-reverse">
              <div
                class="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-content shadow-sm"
              >
                <p class="mb-1 text-xs font-bold opacity-70">You</p>

                <p class="whitespace-pre-wrap">{{ chat.content }}</p>
              </div>
            </div>

            <div class="flex flex-row gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-full border border-base-300 bg-base-100"
              >
                <Icon name="kind-icon:weird" class="h-5 w-5 text-secondary" />
              </div>

              <div
                class="max-w-[85%] rounded-2xl rounded-bl-sm bg-base-100 px-4 py-3 text-sm leading-relaxed shadow-sm"
              >
                <p class="mb-1 text-xs font-bold text-base-content/50">
                  Weirdlandia
                </p>

                <span
                  v-if="!chat.botResponse"
                  class="flex items-center gap-1 py-1 text-base-content/60"
                >
                  <span class="story-dot" />
                  <span class="story-dot delay-150" />
                  <span class="story-dot delay-300" />
                </span>

                <p v-else class="whitespace-pre-wrap text-base-content/80">
                  {{ chat.botResponse }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Composer -->
      <footer class="shrink-0 border-t border-base-300 bg-base-100 p-3">
        <div class="mx-auto flex max-w-3xl flex-col gap-2">
          <textarea
            :value="storyStore.customDirection"
            class="textarea textarea-bordered min-h-20 w-full resize-none rounded-2xl bg-base-200"
            placeholder="Choose an option, use an item, ask a question, trigger a skill check, or do something deeply unwise..."
            :disabled="storyStore.isBusy"
            @input="
              storyStore.setCustomDirection(
                ($event.target as HTMLTextAreaElement).value,
              )
            "
            @keydown.enter.exact.prevent="
              storyStore.canSubmitStory && storyStore.submitStoryTurn()
            "
          />

          <button
            class="btn btn-success min-h-12 w-full rounded-2xl"
            type="button"
            :disabled="!storyStore.canSubmitStory"
            @click="storyStore.submitStoryTurn"
          >
            <span
              v-if="storyStore.isBusy"
              class="loading loading-spinner loading-sm"
            />
            <Icon v-else name="kind-icon:play" class="h-5 w-5" />
            {{
              storyStore.isBusy ? 'Story goblin thinking...' : 'Send Next Turn'
            }}
          </button>
        </div>
      </footer>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useArtStore, type ArtImage } from '@/stores/artStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'
import { useSheetStore } from '@/stores/sheetStore'
import { useStoryStore } from '@/stores/storyStore'
import {
  parseScenarioIntros,
  splitIntro,
} from '@/stores/helpers/scenarioHelper'

const scenarioStore = useScenarioStore()
const characterStore = useCharacterStore()
const rewardStore = useRewardStore()
const serverStore = useServerStore()
const sheetStore = useSheetStore()
const storyStore = useStoryStore()
const artStore = useArtStore()

// DOM-only concerns live here; everything else is store state.
const storyLogRef = ref<HTMLElement | null>(null)
const scenarioArtImage = ref<ArtImage | null>(null)

const selectedScenario = computed(() => scenarioStore.selectedScenario)

const selectedScenarioTitle = computed(
  () => selectedScenario.value?.title || 'No scenario selected',
)

const selectedScenarioImage = computed(() => {
  if (scenarioArtImage.value?.imageData) {
    return `data:image/${scenarioArtImage.value.fileType};base64,${scenarioArtImage.value.imageData}`
  }

  return selectedScenario.value?.imagePath || '/images/scenarios/space.webp'
})

const introChoices = computed(() => {
  return parseScenarioIntros(selectedScenario.value?.intros).map((raw) => ({
    raw,
    ...splitIntro(raw),
  }))
})

const selectedCharacterTitle = computed(() => {
  return characterStore.selectedCharacter?.name || 'No character selected'
})

const selectedRewardTitle = computed(() => {
  const reward = rewardStore.selectedReward

  if (!reward) return 'No reward selected'

  return reward.name || reward.description || 'Unnamed reward'
})

const activeServerName = computed(() => {
  return (
    serverStore.activeTextServer?.label ||
    serverStore.activeTextServer?.title ||
    'No text server selected'
  )
})

async function copyPrompt() {
  if (!storyStore.storyPromptPreview) return

  await navigator.clipboard.writeText(storyStore.storyPromptPreview)
  storyStore.setStatus('Story prompt copied.')
}

// ---------- DOM: scrolling + art loading ----------

function scrollToBottom() {
  const el = storyLogRef.value

  if (!el) return

  el.scrollTop = el.scrollHeight
}

async function loadScenarioArt() {
  scenarioArtImage.value = null

  const artImageId = selectedScenario.value?.artImageId

  if (!artImageId) return

  try {
    const result = await artStore.getArtImageById(artImageId)

    if (result) {
      scenarioArtImage.value = result
    }
  } catch (error) {
    console.error('Failed to load scenario art image:', error)
  }
}

onMounted(async () => {
  await Promise.all([storyStore.initialize(), loadScenarioArt()])
  scrollToBottom()
})

// Needed: art fetch is async I/O keyed off store state
watch(
  () => selectedScenario.value?.id,
  async () => {
    await loadScenarioArt()
  },
)

// Needed: pinning scroll to streaming output is a DOM concern
watch(
  () => storyStore.sessionChats.map((chat) => chat.botResponse).join(''),
  async () => {
    await nextTick()
    scrollToBottom()
  },
)
</script>

<style scoped>
.story-dot {
  display: inline-block;
  height: 0.375rem;
  width: 0.375rem;
  border-radius: 9999px;
  background: currentColor;
  animation: story-bounce 1s ease-in-out infinite;
}

.delay-150 {
  animation-delay: 150ms;
}

.delay-300 {
  animation-delay: 300ms;
}

@keyframes story-bounce {
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
