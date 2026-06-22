<!-- /components/content/weird/scenario-interact.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3 text-smart">
    <div
      v-if="storyStore.statusMessage"
      class="shrink-0 rounded-2xl border p-3 text-smart"
      :class="
        storyStore.statusTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      {{ storyStore.statusMessage }}
    </div>

    <scenario-gallery
      v-if="storyStore.phase === 'browse'"
      class="min-h-0 flex-1"
      variant="grid"
      title="Choose Your Scenario"
      subtitle="Tap a world to read it, configure it, and launch a story."
      :show-inspirations="false"
    />

    <section
      v-else-if="storyStore.phase === 'configure'"
      class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain"
    >
      <div
        class="flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-100 p-2 pl-1 shadow-sm"
      >
        <div class="flex min-w-0 items-center gap-1">
          <button
            class="btn btn-ghost btn-sm gap-1.5 rounded-xl text-smart-button"
            type="button"
            @click="storyStore.backToBrowse"
          >
            <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
            <span class="hidden sm:inline">All Scenarios</span>
          </button>

          <div class="min-w-0">
            <h1
              class="truncate text-smart-title font-black leading-tight text-base-content"
            >
              {{ selectedScenarioTitle }}
            </h1>

            <p
              v-if="selectedScenario?.genres"
              class="truncate text-smart-caption text-base-content/60"
            >
              {{ selectedScenario.genres }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <span
            v-if="selectedScenario?.isMature"
            class="badge badge-warning badge-sm text-smart-caption"
          >
            Mature
          </span>
          <button
            class="btn btn-ghost btn-sm rounded-xl text-smart-button"
            type="button"
            title="Show or hide scenario details"
            @click="sheetStore.toggleSheet()"
          >
            <Icon name="kind-icon:info" class="h-4 w-4" />
            <span class="hidden sm:inline">Info</span>
          </button>
        </div>
      </div>

      <article
        v-if="introChoices.length"
        class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
      >
        <h2 class="text-smart-heading font-black text-base-content">
          How does it begin?
        </h2>

        <p class="mt-0.5 text-smart text-base-content/60">
          Pick an opening, or write your own direction below.
        </p>

        <div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <button
            v-for="(intro, index) in introChoices"
            :key="`${intro.label}-${index}`"
            type="button"
            class="group flex flex-col gap-1 rounded-2xl border p-4 text-left text-smart transition"
            :class="
              scenarioStore.currentChoice === intro.raw
                ? 'border-primary bg-primary/10 ring-2 ring-primary'
                : 'border-base-300 bg-base-200 hover:border-primary/40 hover:bg-base-200/60'
            "
            @click="storyStore.pickIntro(intro.raw)"
          >
            <span
              v-if="intro.label"
              class="text-smart-caption font-black uppercase tracking-widest"
              :class="
                scenarioStore.currentChoice === intro.raw
                  ? 'text-primary'
                  : 'text-primary/70 group-hover:text-primary'
              "
            >
              {{ intro.label }}
            </span>

            <span class="text-smart leading-relaxed text-base-content/80">
              {{ intro.body }}
            </span>
          </button>
        </div>
      </article>

      <article
        class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
      >
        <h2 class="text-smart-heading font-black text-base-content">
          Direction
        </h2>

        <p class="mt-0.5 text-smart text-base-content/60">
          Add an optional tone, goal, complication, question, or narrative
          twist.
        </p>

        <label class="form-control mt-3">
          <span class="label">
            <span class="label-text text-smart-caption font-bold">
              Custom direction
            </span>
            <span
              class="label-text-alt text-smart-caption text-base-content/50"
            >
              Optional
            </span>
          </span>

          <textarea
            :value="storyStore.customDirection"
            class="textarea textarea-bordered min-h-28 w-full resize-none rounded-2xl bg-base-200 text-smart"
            placeholder="Add a tone, goal, complication, question, or narrative twist..."
            :disabled="storyStore.isBusy"
            @input="
              storyStore.setCustomDirection(
                ($event.target as HTMLTextAreaElement).value,
              )
            "
          />
        </label>
      </article>

      <div class="shrink-0 pb-2">
        <button
          class="btn btn-success min-h-14 w-full rounded-2xl text-smart-button"
          type="button"
          :disabled="!canLaunchScenario"
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
          v-if="!canLaunchScenario && !storyStore.isBusy"
          class="mt-2 text-center text-smart text-base-content/60"
        >
          Pick an opening or write a direction to launch.
        </p>

        <div class="mt-2 flex items-center justify-between gap-2 px-1">
          <button
            class="btn btn-ghost btn-xs rounded-xl text-smart-caption"
            type="button"
            :disabled="!storyStore.storyPromptPreview"
            @click="copyPrompt"
          >
            Copy Full Prompt
          </button>

          <span class="text-smart-caption text-base-content/50">
            {{ activeServerLabel }}
          </span>
        </div>
      </div>
    </section>

    <section
      v-else
      class="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    >
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
            <h2
              class="truncate text-smart-heading font-black text-base-content"
            >
              {{ selectedScenarioTitle }}
            </h2>

            <p class="truncate text-smart-caption text-base-content/60">
              Scenario session · {{ activeServerLabel }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <button
            class="btn btn-ghost btn-sm rounded-xl text-smart-button"
            type="button"
            :disabled="storyStore.isBusy"
            title="Start over with the same scenario"
            @click="storyStore.newStory"
          >
            <Icon name="kind-icon:refresh" class="h-4 w-4" />
            <span class="hidden sm:inline">New Story</span>
          </button>

          <button
            class="btn btn-ghost btn-sm rounded-xl text-smart-button"
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

      <section
        ref="storyLogRef"
        class="min-h-0 overflow-y-auto overscroll-contain bg-base-200 p-4"
      >
        <div class="mx-auto flex max-w-3xl flex-col gap-4">
          <article
            v-for="chat in storyStore.storyDisplayChats"
            :key="chat.id"
            class="flex flex-col gap-3"
          >
            <div class="flex flex-row-reverse">
              <div
                class="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-smart leading-relaxed text-primary-content shadow-sm"
              >
                <p class="mb-1 text-smart-caption font-bold opacity-70">You</p>
                <p class="whitespace-pre-wrap">{{ chat.content }}</p>
              </div>
            </div>

            <div class="flex flex-row gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-full border border-base-300 bg-base-100"
              >
                <Icon name="kind-icon:alien" class="h-5 w-5 text-secondary" />
              </div>

              <div
                class="flex max-w-[85%] flex-col gap-3 rounded-2xl rounded-bl-sm bg-base-100 px-4 py-3 text-smart leading-relaxed shadow-sm"
              >
                <p class="text-smart-caption font-bold text-base-content/50">
                  Weirdlandia
                </p>

                <span
                  v-if="chat.isStreaming && !chat.botResponse"
                  class="flex items-center gap-1 py-1 text-base-content/60"
                >
                  <span class="story-dot" />
                  <span class="story-dot delay-150" />
                  <span class="story-dot delay-300" />
                </span>

                <p
                  v-else
                  class="whitespace-pre-wrap text-base-content/80"
                  :class="[
                    chat.isStreaming ? 'story-streaming' : '',
                    chat.isInterrupted ? 'text-warning' : '',
                  ]"
                >
                  {{ chat.displayResponse || chat.botResponse }}
                </p>

                <div
                  v-if="!chat.isStreaming && chat.replyOptions.length"
                  class="grid gap-2 pt-1"
                >
                  <p
                    class="text-smart-caption font-black uppercase tracking-widest text-base-content/40"
                  >
                    What do you do next?
                  </p>

                  <button
                    v-for="option in chat.replyOptions"
                    :key="option.id"
                    type="button"
                    class="group flex items-start gap-2 rounded-2xl border p-3 text-left text-smart transition"
                    :class="
                      storyStore.selectedReplyMatches(option)
                        ? 'border-secondary bg-secondary/15 ring-2 ring-secondary'
                        : 'border-base-300 bg-base-200 hover:border-secondary/50 hover:bg-secondary/10'
                    "
                    :disabled="storyStore.isBusy"
                    @click="storyStore.selectReplyOption(option)"
                  >
                    <span
                      class="shrink-0 rounded-xl px-2 py-0.5 text-smart-caption font-black"
                      :class="
                        storyStore.selectedReplyMatches(option)
                          ? 'bg-secondary text-secondary-content'
                          : 'bg-base-100 text-secondary group-hover:bg-secondary group-hover:text-secondary-content'
                      "
                    >
                      {{ option.label }}
                    </span>

                    <span class="min-w-0 flex-1 leading-relaxed">
                      {{ option.text }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <footer class="shrink-0 border-t border-base-300 bg-base-100 p-3">
        <div class="mx-auto flex max-w-3xl flex-col gap-2">
          <div
            v-if="storyStore.customDirection"
            class="rounded-2xl border border-secondary/30 bg-secondary/10 p-3 text-smart"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p
                  class="text-smart-caption font-black uppercase tracking-widest text-secondary"
                >
                  Selected action
                </p>

                <p class="mt-1 whitespace-pre-wrap text-base-content">
                  {{ storyStore.customDirection }}
                </p>
              </div>

              <button
                class="btn btn-ghost btn-xs shrink-0 rounded-xl text-smart-caption"
                type="button"
                :disabled="storyStore.isBusy"
                @click="storyStore.setCustomDirection('')"
              >
                Clear
              </button>
            </div>
          </div>

          <textarea
            :value="storyStore.customDirection"
            class="textarea textarea-bordered min-h-20 w-full resize-none rounded-2xl bg-base-200 text-smart"
            placeholder="Choose a reply above, type your own action, ask a question, or do something deeply unwise..."
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

          <div
            class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-200 px-3 py-2 text-smart-caption text-base-content/60"
          >
            <span class="font-bold text-base-content/70">Text server</span>
            <span class="truncate">{{ activeServerLabel }}</span>
          </div>

          <button
            class="btn btn-success min-h-12 w-full rounded-2xl text-smart-button"
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
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'
import { useSheetStore } from '@/stores/sheetStore'
import { useStoryStore } from '@/stores/storyStore'
import {
  parseScenarioIntros,
  splitIntro,
} from '@/stores/helpers/scenarioHelper'

const scenarioStore = useScenarioStore()
const serverStore = useServerStore()
const sheetStore = useSheetStore()
const storyStore = useStoryStore()
const artStore = useArtStore()

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

const activeServerLabel = computed(() => {
  const server = serverStore.activeTextServer

  if (!server) return 'System OpenAI · mana'

  const name = server.label || server.title || `Server #${server.id}`
  const type = server.serverType ? ` · ${server.serverType}` : ''

  return `${name}${type}`
})

const canLaunchScenario = computed(() => {
  if (storyStore.isBusy) return false
  if (!selectedScenario.value) return false

  return Boolean(
    scenarioStore.currentChoice || storyStore.customDirection.trim(),
  )
})

async function copyPrompt() {
  if (!storyStore.storyPromptPreview) return

  await navigator.clipboard.writeText(storyStore.storyPromptPreview)
  storyStore.setStatus('Story prompt copied.')
}

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

watch(
  () => selectedScenario.value?.id,
  async () => {
    await loadScenarioArt()
  },
)

watch(
  () =>
    storyStore.storyDisplayChats
      .map((chat) => `${chat.botResponse || ''}:${chat.replyOptions.length}`)
      .join('|'),
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

.story-streaming::after {
  display: inline-block;
  margin-left: 0.125rem;
  color: currentColor;
  content: '▌';
  animation: story-cursor 0.85s steps(2, start) infinite;
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

@keyframes story-cursor {
  0%,
  45% {
    opacity: 1;
  }

  46%,
  100% {
    opacity: 0;
  }
}
</style>
