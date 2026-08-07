<!-- /components/scenarios/scenario-workspace.vue -->
<!--
  The Scenario working surface: configure a chosen Scenario, then play it.

  Split out of scenario-interact, which had grown to 531 lines because both
  phases were inlined in the router. dream-interact is 57 lines for the same
  job, because its markup and its logic live in dream-workspace -- that is the
  frame every model shares:

    <x-gallery v-if="!selected" />     <x-workspace v-else />

  Silas, 2026-08-06: the interact tier "will be inevitably less consistent
  across models, since that's where we are actually hitting 'what we do with
  them uniquely'." So the uniform thing is that frame, not what is inside it.
  Nothing about how a Scenario is configured or played changes here; it just
  stops being inlined in the component whose job is choosing between phases.

  Phase lives in storyStore, so this component is mounted for `configure` and
  `play` and picks between them itself.
-->
<template>
  <section
    v-if="storyStore.phase === 'configure'"
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

    <EntityArtManager
      v-if="selectedScenario"
      entity-type="scenario"
      :entity="selectedScenario"
      :slots="[
        {
          field: 'imagePath',
          label: 'Scenario image',
          aspect: '16 / 9',
          width: 1536,
          height: 864,
        },
        {
          field: 'iconPath',
          label: 'Icon',
          aspect: '1 / 1',
          width: 256,
          height: 256,
        },
        {
          field: 'cardPath',
          label: 'Card',
          aspect: '2 / 3',
          width: 512,
          height: 768,
        },
        {
          field: 'heroPath',
          label: 'Hero',
          aspect: '16 / 9',
          width: 1280,
          height: 720,
        },
      ]"
    />

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

      <kr-choice-list
        class="mt-3"
        layout="stack"
        :choices="introListChoices"
        :selected-key="selectedIntroKey"
        :show-index="false"
        hint-prose
        label="Opening choices"
        @select="handleIntroSelected"
      />
    </article>

    <article
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
      <h2 class="text-smart-heading font-black text-base-content">Direction</h2>

      <p class="mt-0.5 text-smart text-base-content/60">
        Add an optional tone, goal, complication, question, or narrative twist.
      </p>

      <label class="form-control mt-3">
        <span class="label">
          <span class="label-text text-smart-caption font-bold">
            Custom direction
          </span>
          <span class="label-text-alt text-smart-caption text-base-content/50">
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
          <h2 class="truncate text-smart-heading font-black text-base-content">
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

    <!-- The story log is kr-chat-window (interface-vision Phase 5, the
           last of the three surfaces -- character-interact.vue's PR #1400
           and reward-interact.vue's t-087 are the reference shape). This
           also removes the bespoke .story-dot/.story-streaming keyframes
           below in favor of kr-chat-window's own streaming placeholder. -->
    <kr-chat-window
      class="bg-base-200 p-4"
      :turns="chatTurns"
      label="Weirdlandia story"
      :is-streaming="storyStore.isBusy"
      :streaming-text="streamingStoryText"
      streaming-label="Story goblin thinking..."
      empty-label="The story will appear here once it begins."
      :selected-key="lastReplyKey"
      @choose="handleReplyChosen"
    />

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
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useArtStore, type ArtImage } from '@/stores/artStore'
import { resolveArtImageSrc } from '@/utils/artImageSrc'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'
import { useSheetStore } from '@/stores/sheetStore'
import { useStoryStore } from '@/stores/storyStore'
import {
  parseScenarioIntros,
  splitIntro,
} from '@/stores/helpers/scenarioHelper'
import type { NarrativeTurn } from '@/components/narrative/kr-chat-window.vue'
import type { NarrativeChoice } from '@/components/narrative/kr-choice-list.vue'

const scenarioStore = useScenarioStore()
const serverStore = useServerStore()
const sheetStore = useSheetStore()
const storyStore = useStoryStore()
const artStore = useArtStore()

const scenarioArtImage = ref<ArtImage | null>(null)

const selectedScenario = computed(() => scenarioStore.selectedScenario)

const selectedScenarioTitle = computed(
  () => selectedScenario.value?.title || 'No scenario selected',
)

const selectedScenarioImage = computed(() =>
  // Path-first: art image path, then its base64, then the scenario's imagePath.
  resolveArtImageSrc(
    scenarioArtImage.value,
    selectedScenario.value?.imagePath || '/images/scenarios/space.webp',
  ),
)

const introChoices = computed(() => {
  return parseScenarioIntros(selectedScenario.value?.intros).map((raw) => ({
    raw,
    ...splitIntro(raw),
  }))
})

const introListChoices = computed<NarrativeChoice[]>(() =>
  introChoices.value.map((intro, index) => ({
    key: String(index),
    label: intro.label || 'Opening',
    hint: intro.body,
  })),
)

const selectedIntroKey = computed(() => {
  const raw = scenarioStore.currentChoice
  if (!raw) return null
  const index = introChoices.value.findIndex((intro) => intro.raw === raw)
  return index >= 0 ? String(index) : null
})

function handleIntroSelected(choice: NarrativeChoice) {
  const intro = introChoices.value[Number(choice.key)]
  if (intro) storyStore.pickIntro(intro.raw)
}

/* Each session Chat becomes a user turn plus (once it has a response) a
   narrator turn. The in-flight chat is withheld from `turns` while
   streaming -- its growing text surfaces through kr-chat-window's own
   `streamingText` placeholder instead, matching reward-interact.vue's
   t-087 pattern. storyStore.storyDisplayChats already does the parsing
   (display text, reply options) this surface used to do inline. */
const chatTurns = computed<NarrativeTurn[]>(() => {
  const turns: NarrativeTurn[] = []

  for (const chat of storyStore.storyDisplayChats) {
    turns.push({ id: `user-${chat.id}`, text: chat.content, from: 'user' })
    if (chat.isStreaming) continue

    const choices: NarrativeChoice[] = chat.replyOptions.map((option) => ({
      key: option.id,
      label: option.label,
      hint: option.text,
    }))

    turns.push({
      id: `narrator-${chat.id}`,
      text: chat.displayResponse,
      from: 'narrator',
      speaker: 'Weirdlandia',
      choices: choices.length ? choices : undefined,
    })
  }

  return turns
})

const streamingStoryText = computed(() => {
  const chats = storyStore.storyDisplayChats
  const last = chats[chats.length - 1]
  return last?.isStreaming ? last.displayResponse : ''
})

/*
 * The choice most recently picked, so kr-chat-window can ring it (t-090).
 * This surface had that highlight before its migration onto the shared kit and
 * lost it, because kr-chat-window had no way to forward a selectedKey to the
 * choice lists it embeds. The key is the display key kr-choice-list emits, not
 * the recovered path text, since that is what it compares against.
 */
const lastReplyKey = ref<string | null>(null)

function handleReplyChosen(choice: NarrativeChoice) {
  lastReplyKey.value = choice.key
  storyStore.selectReplyOption(choice.hint ?? choice.label)
}

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
})

watch(
  () => selectedScenario.value?.id,
  async () => {
    await loadScenarioArt()
  },
)
</script>
