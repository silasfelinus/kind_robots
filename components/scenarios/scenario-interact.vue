<!-- /components/content/weird/scenario-interact.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3">
    <!-- Status toast -->
    <div
      v-if="statusMessage"
      class="shrink-0 rounded-2xl border p-3 text-sm"
      :class="
        statusTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      {{ statusMessage }}
    </div>

    <!-- ==================================================== -->
    <!-- PHASE 1: BROWSE — pick a world                       -->
    <!-- ==================================================== -->
    <scenario-gallery
      v-if="phase === 'browse'"
      class="min-h-0 flex-1"
      variant="grid"
      title="Choose Your Scenario"
      subtitle="Tap a world to read it, configure it, and launch a story."
      :show-card-actions="true"
      :show-inspirations="false"
      @select="handleScenarioPicked"
    />

    <!-- ==================================================== -->
    <!-- PHASE 2: CONFIGURE — summary, choices, configurables -->
    <!-- ==================================================== -->
    <section
      v-else-if="phase === 'configure'"
      class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain"
    >
      <!-- Back bar -->
      <div class="flex shrink-0 items-center gap-2">
        <button
          class="btn btn-ghost btn-sm gap-1.5 rounded-xl"
          type="button"
          @click="backToBrowse"
        >
          <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
          All Scenarios
        </button>
      </div>

      <!-- Hero: image-first scenario summary -->
      <article
        class="shrink-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-md"
      >
        <figure class="relative aspect-video w-full bg-base-300 md:aspect-21/9">
          <img
            :src="selectedScenarioImage"
            :alt="selectedScenarioTitle"
            class="h-full w-full object-cover"
          />

          <div
            class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/40 to-transparent px-4 pb-4 pt-16 md:px-6"
          >
            <h1
              class="text-2xl font-black leading-tight text-white drop-shadow md:text-3xl"
            >
              {{ selectedScenarioTitle }}
            </h1>

            <div class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-if="selectedScenario?.genres"
                class="badge badge-primary badge-sm"
              >
                {{ selectedScenario.genres }}
              </span>

              <span
                v-if="selectedScenario?.isMature"
                class="badge badge-warning badge-sm"
              >
                Mature
              </span>
            </div>
          </div>
        </figure>

        <div class="flex flex-col gap-4 p-4 md:p-6">
          <p
            class="max-w-prose text-sm leading-relaxed text-base-content/80 md:text-base"
          >
            {{
              selectedScenario?.description ||
              'No description yet. The plot goblin remains suspiciously quiet.'
            }}
          </p>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              v-if="selectedScenario?.locations"
              class="rounded-xl border border-base-300 bg-base-200 p-3"
            >
              <p
                class="text-xs font-bold uppercase tracking-wider text-base-content/50"
              >
                Locations
              </p>

              <p class="mt-1 text-sm leading-relaxed text-base-content/80">
                {{ selectedScenario.locations }}
              </p>
            </div>

            <div
              v-if="selectedScenario?.inspirations"
              class="rounded-xl border border-base-300 bg-base-200 p-3"
            >
              <p
                class="text-xs font-bold uppercase tracking-wider text-base-content/50"
              >
                Inspirations
              </p>

              <p class="mt-1 text-sm leading-relaxed text-base-content/80">
                {{ selectedScenario.inspirations }}
              </p>
            </div>
          </div>
        </div>
      </article>

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
            @click="pickIntro(intro.raw)"
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
              v-model="customDirection"
              class="textarea textarea-bordered min-h-20 w-full resize-none rounded-2xl bg-base-200"
              placeholder="Add a tone, goal, complication, skill check, inventory item, or narrative twist..."
              :disabled="isBusy"
            />
          </label>
        </div>
      </article>

      <!-- Launch -->
      <div class="shrink-0 pb-2">
        <button
          class="btn btn-success min-h-14 w-full rounded-2xl text-base"
          type="button"
          :disabled="!canStartStory"
          @click="submitStoryTurn"
        >
          <span v-if="isBusy" class="loading loading-spinner loading-sm" />
          <Icon v-else name="kind-icon:play" class="h-5 w-5" />
          {{ isBusy ? 'Story goblin thinking...' : 'Start Story' }}
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
            :disabled="!storyPromptPreview"
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
    <!-- PHASE 3: STORY — the running narrative               -->
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
            :disabled="isBusy"
            title="Start over with the same scenario"
            @click="newStory"
          >
            <Icon name="kind-icon:refresh" class="h-4 w-4" />
            <span class="hidden sm:inline">New Story</span>
          </button>

          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isBusy"
            title="End the story and browse scenarios"
            @click="endAndBrowse"
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
            v-for="chat in sessionChats"
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
            v-model="customDirection"
            class="textarea textarea-bordered min-h-20 w-full resize-none rounded-2xl bg-base-200"
            placeholder="Choose an option, use an item, ask a question, trigger a skill check, or do something deeply unwise..."
            :disabled="isBusy"
            @keydown.enter.exact.prevent="canSubmitStory && submitStoryTurn()"
          />

          <button
            class="btn btn-success min-h-12 w-full rounded-2xl"
            type="button"
            :disabled="!canSubmitStory"
            @click="submitStoryTurn"
          >
            <span v-if="isBusy" class="loading loading-spinner loading-sm" />
            <Icon v-else name="kind-icon:play" class="h-5 w-5" />
            {{ isBusy ? 'Story goblin thinking...' : 'Send Next Turn' }}
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
import { useChatStore } from '@/stores/chatStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import { useWeirdStore } from '@/stores/weirdStore'
import {
  parseScenarioIntros,
  splitIntro,
} from '@/stores/helpers/scenarioHelper'

type ScenarioSessionChat = {
  id: number
  content: string
  botResponse?: string | null
}

type ChatRuntimeInput = Parameters<
  ReturnType<typeof useChatStore>['addChat']
>[0]

type StoryMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type InteractPhase = 'browse' | 'configure' | 'story'

const scenarioStore = useScenarioStore()
const characterStore = useCharacterStore()
const rewardStore = useRewardStore()
const chatStore = useChatStore()
const serverStore = useServerStore()
const userStore = useUserStore()
const weirdStore = useWeirdStore()
const artStore = useArtStore()

const storyLogRef = ref<HTMLElement | null>(null)
const storyRunning = ref(false)
const isStartingStory = ref(false)
const customDirection = ref('')
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const sessionChatIds = ref<number[]>([])
const scenarioArtImage = ref<ArtImage | null>(null)

// ---------- Phase ----------

const phase = computed<InteractPhase>(() => {
  if (storyRunning.value || sessionChats.value.length > 0) return 'story'
  if (scenarioStore.selectedScenario) return 'configure'

  return 'browse'
})

// ---------- Selections ----------

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
  const character = characterStore.selectedCharacter

  if (!character) return 'No character selected'

  return character.name || 'Unnamed character'
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

// ---------- Session state ----------

const sessionChats = computed<ScenarioSessionChat[]>(() => {
  return chatStore.chats.filter((chat) =>
    sessionChatIds.value.includes(chat.id),
  ) as ScenarioSessionChat[]
})

const isResponding = computed(() => {
  return sessionChats.value.some((chat) => !chat.botResponse)
})

const isBusy = computed(() => {
  return isStartingStory.value || isResponding.value
})

const canStartStory = computed(() => {
  return Boolean(
    scenarioStore.selectedScenario &&
    characterStore.selectedCharacter &&
    !isBusy.value,
  )
})

const canContinueStory = computed(() => {
  return Boolean(
    storyRunning.value &&
    customDirection.value.trim() &&
    !isBusy.value &&
    scenarioStore.selectedScenario &&
    characterStore.selectedCharacter,
  )
})

const canSubmitStory = computed(() => {
  return storyRunning.value ? canContinueStory.value : canStartStory.value
})

const storyPromptPreview = computed(() => {
  if (!scenarioStore.selectedScenario || !characterStore.selectedCharacter) {
    return ''
  }

  return storyRunning.value ? buildNextTurnPrompt() : buildStoryPrompt()
})

const systemPrompt = computed(() => {
  return [
    'You are the Weirdlandia storyteller for Kind Robots.',
    'Write interactive branching fiction with sharp sensory detail, meaningful consequences, and playful weirdness.',
    'Honor the selected scenario, character, reward, and opening choice.',
    'End every response with 3-5 clear follow-up options.',
    'Each option should invite a different kind of action: cautious, bold, clever, strange, or character-driven.',
    'Do not explain the prompt. Write the story scene directly.',
  ].join('\n')
})

const fullSessionMessages = computed<StoryMessage[]>(() => {
  return sessionChats.value.flatMap((chat) => {
    const messages: StoryMessage[] = [
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
})

// ---------- Navigation ----------

function handleScenarioPicked() {
  // Selection already happened in the store via the card; clear any stale
  // opening choice from a previously browsed scenario.
  scenarioStore.setCurrentChoice('')
  customDirection.value = ''
  statusMessage.value = ''
}

function backToBrowse() {
  scenarioStore.deselectScenario()
  scenarioStore.setCurrentChoice('')
  customDirection.value = ''
  statusMessage.value = ''
}

function pickIntro(intro: string) {
  if (scenarioStore.currentChoice === intro) {
    scenarioStore.setCurrentChoice('')

    if (customDirection.value === intro) {
      customDirection.value = ''
    }

    return
  }

  scenarioStore.setCurrentChoice(intro)
  customDirection.value = intro
}

function endAndBrowse() {
  newStory()
  backToBrowse()
}

// ---------- Status ----------

function setStatus(messageText: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = messageText
  statusTone.value = tone
}

// ---------- Prompt building ----------

function buildStoryPrompt() {
  const scenario = scenarioStore.selectedScenario
  const character = characterStore.selectedCharacter
  const reward = rewardStore.selectedReward

  if (!scenario || !character) return ''

  const direction = customDirection.value.trim()

  return [
    `Scenario: ${scenario.title}`,
    `Scenario description: ${scenario.description || 'No description provided'}`,
    `Character: ${character.name || 'Unnamed'}`,
    `Character details: ${character.species || 'Unknown species'}, ${
      character.class || 'Unknown class'
    }, ${character.personality || 'unknown personality'}`,
    `Opening choice: ${scenarioStore.currentChoice || 'None selected'}`,
    reward ? `Reward at stake: ${reward.name}` : '',
    reward
      ? `Reward description: ${reward.description || 'No description provided'}`
      : '',
    reward
      ? `Reward flavor: ${reward.flavorText || 'No flavor text provided'}`
      : '',
    reward ? `Reward effect: ${reward.effect || 'Unknown'}` : '',
    direction ? `Player direction: ${direction}` : '',
    '',
    'Generate the next scene as an interactive branching narrative. Include vivid sensory detail, meaningful consequences, and 3-5 clear follow-up options. Let the player continue with a skill check, inventory item, reward use, or custom prompt.',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildNextTurnPrompt() {
  const scenario = scenarioStore.selectedScenario
  const character = characterStore.selectedCharacter
  const reward = rewardStore.selectedReward
  const direction = customDirection.value.trim()

  if (!scenario || !character) return ''

  return [
    `Continue the current Weirdlandia story.`,
    `Scenario: ${scenario.title}`,
    `Character: ${character.name || 'Unnamed'}`,
    reward ? `Reward in play: ${reward.name}` : '',
    reward ? `Reward effect: ${reward.effect || 'Unknown'}` : '',
    `Player action: ${direction}`,
    '',
    'Resolve this action in the ongoing story. Preserve continuity from the previous messages. Include consequences, character-specific reactions, and 3-5 new follow-up options.',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildMessagesForStoryResponse(): StoryMessage[] {
  return [
    {
      role: 'system',
      content: systemPrompt.value,
    },
    ...fullSessionMessages.value,
  ]
}

// ---------- Story lifecycle ----------

function scrollToBottom() {
  const el = storyLogRef.value

  if (!el) return

  el.scrollTop = el.scrollHeight
}

async function copyPrompt() {
  if (!storyPromptPreview.value) return

  await navigator.clipboard.writeText(storyPromptPreview.value)
  setStatus('Story prompt copied.')
}

async function submitStoryTurn() {
  if (storyRunning.value) {
    await continueStory()
    return
  }

  await startStory()
}

async function createAndStreamStoryChat(content: string) {
  const character = characterStore.selectedCharacter

  if (!character) {
    throw new Error('Select a character before launching the story goblin.')
  }

  const payload: ChatRuntimeInput = {
    content,
    userId: userStore.userId ?? userStore.user?.id ?? character.userId ?? 10,
    type: 'Weirdlandia',
    characterId: character.id,
    recipientId: null,
    serverId: serverStore.activeTextServer?.id ?? null,
    isPublic: false,
  }

  const newChat = await chatStore.addChat(payload)

  if (!newChat?.id) {
    throw new Error('Failed to create chat.')
  }

  sessionChatIds.value.push(newChat.id)
  chatStore.selectedChat = newChat

  if (Array.isArray(weirdStore.history)) {
    weirdStore.history.push(newChat)
  }

  await nextTick()
  scrollToBottom()

  if (typeof chatStore.streamResponse !== 'function') {
    throw new Error('chatStore.streamResponse is not available.')
  }

  await chatStore.streamResponse(newChat.id, {
    model: serverStore.activeTextServer?.model || 'gpt-4o-mini',
    temperature: 0.9,
    maxTokens: 2048,
    serverId: serverStore.activeTextServer?.id ?? null,
    messages: buildMessagesForStoryResponse(),
  })

  await nextTick()
  scrollToBottom()

  return newChat
}

async function startStory() {
  if (!canStartStory.value) {
    setStatus(
      'Pick a scenario and character before launching the story goblin.',
      'error',
    )
    return
  }

  const content = buildStoryPrompt()

  if (!content.trim()) {
    setStatus('Could not build story prompt.', 'error')
    return
  }

  isStartingStory.value = true
  statusMessage.value = ''

  try {
    await createAndStreamStoryChat(content)
    storyRunning.value = true
    customDirection.value = ''
  } catch (error) {
    console.error('Error starting the story:', error)
    setStatus(
      error instanceof Error ? error.message : 'Error starting the story.',
      'error',
    )
  } finally {
    isStartingStory.value = false
  }
}

async function continueStory() {
  if (!canContinueStory.value) {
    setStatus('Choose or type the next action before continuing.', 'error')
    return
  }

  const content = buildNextTurnPrompt()

  if (!content.trim()) {
    setStatus('Could not build next-turn prompt.', 'error')
    return
  }

  isStartingStory.value = true
  statusMessage.value = ''

  try {
    await createAndStreamStoryChat(content)
    customDirection.value = ''
  } catch (error) {
    console.error('Error continuing the story:', error)
    setStatus(
      error instanceof Error ? error.message : 'Error continuing the story.',
      'error',
    )
  } finally {
    isStartingStory.value = false
  }
}

function newStory() {
  sessionChatIds.value = []
  storyRunning.value = false
  chatStore.selectedChat = null
  customDirection.value = ''
  statusMessage.value = ''

  if (Array.isArray(weirdStore.history)) {
    weirdStore.history = []
  }
}

// ---------- Art loading ----------

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

// ---------- Lifecycle ----------

onMounted(async () => {
  await Promise.all([
    chatStore.initialize(),
    loadScenarioArt(),
    ...(serverStore.hasLoaded
      ? []
      : [serverStore.initialize({ fetchRemote: true })]),
  ])
})

watch(
  () => selectedScenario.value?.id,
  async () => {
    await loadScenarioArt()
  },
)

watch(
  () => sessionChats.value.map((chat) => chat.botResponse).join(''),
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
