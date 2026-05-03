<!-- /components/dreams/dream-interact.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
  >
    <header
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="min-w-0">
          <h1 class="text-2xl font-black text-primary md:text-3xl">
            Dream Interact
          </h1>

          <p class="mt-1 text-sm text-base-content/70">
            Send text, generate images, steer prompts, and evolve the shared
            dream.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="tab in modeTabs"
            :key="tab.key"
            type="button"
            class="btn btn-sm rounded-2xl"
            :class="
              activeMode === tab.key ? 'btn-primary text-white' : 'btn-ghost'
            "
            @click="activeMode = tab.key"
          >
            <Icon :name="tab.icon" class="h-4 w-4" />
            {{ tab.label }}
          </button>
        </div>
      </div>
    </header>

    <div
      v-if="statusMessage"
      class="rounded-2xl border p-3 text-sm"
      :class="
        statusTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      {{ statusMessage }}
    </div>

    <section
      v-if="activeMode === 'shared'"
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
    >
      <div class="flex min-h-0 flex-col gap-4 overflow-y-auto">
        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-xl font-bold text-base-content">Active Dream</h2>
              <p class="text-sm text-base-content/60">
                Pick an existing dream or create one from the current intro.
              </p>
            </div>

            <button
              class="btn btn-sm btn-secondary rounded-2xl"
              type="button"
              @click="startFreshDream"
            >
              <Icon name="kind-icon:sparkles" class="h-4 w-4" />
              New
            </button>
          </div>

          <dream-card
            v-if="dreamStore.selectedDream"
            :dream="dreamStore.selectedDream"
            :selected="true"
            :show-actions="false"
            :show-open-button="false"
          />

          <dream-gallery
            v-else
            variant="dropdown"
            title="Dream"
            subtitle="Choose an existing dream."
            :show-images="false"
            :show-controls="false"
            :show-toolbar="false"
          />
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="mb-3 text-xl font-bold text-base-content">
            Start or Update the Dream
          </h2>

          <label class="form-control">
            <span class="label">
              <span class="label-text font-bold">Intro Text</span>
              <span class="label-text-alt text-base-content/50"
                >shared nudge</span
              >
            </span>

            <textarea
              v-model="introText"
              class="textarea textarea-bordered min-h-32 resize-none rounded-2xl bg-base-200"
              placeholder="Describe the opening scene, collaborative goal, or next dream state..."
            />
          </label>

          <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              class="btn btn-primary rounded-2xl text-white"
              type="button"
              :disabled="dreamStore.isSaving || !introText.trim()"
              @click="sendIntroText"
            >
              Send Intro
            </button>

            <button
              class="btn btn-secondary rounded-2xl"
              type="button"
              :disabled="!introText.trim()"
              @click="copyIntroToPrompt"
            >
              Intro → Prompt
            </button>

            <button
              class="btn btn-ghost rounded-2xl"
              type="button"
              @click="seedIntro"
            >
              Random Seed
            </button>
          </div>
        </section>
      </div>

      <aside class="flex min-h-0 flex-col gap-4 overflow-hidden">
        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="mb-3 text-lg font-bold text-base-content">
            Active Engines
          </h2>

          <div class="grid grid-cols-1 gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/50">
                Art Server
              </p>

              <p class="mt-1 truncate font-semibold">
                {{ activeArtServerName }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/50">
                Text Server
              </p>

              <p class="mt-1 truncate font-semibold">
                {{ activeTextServerName }}
              </p>
            </div>
          </div>
        </section>

        <section
          class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="border-b border-base-300 p-4">
            <h2 class="text-lg font-bold text-base-content">
              Recent Responses
            </h2>
          </div>

          <div class="min-h-0 h-full overflow-y-auto p-3">
            <dream-list />
          </div>
        </section>
      </aside>
    </section>

    <section
      v-else-if="activeMode === 'chat'"
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="shrink-0 border-b border-base-300 p-4">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-xl font-bold text-base-content">Dream Chat</h2>
              <p class="text-sm text-base-content/60">
                Text nudges become collaborative history.
              </p>
            </div>

            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              :disabled="
                !dreamStore.selectedDream?.id || dreamStore.chatsLoading
              "
              @click="refreshChats"
            >
              Refresh
            </button>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto bg-base-200 p-3">
          <dream-list />
        </div>

        <div class="shrink-0 border-t border-base-300 bg-base-100 p-3">
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <textarea
              v-model="chatMessage"
              class="textarea textarea-bordered min-h-16 resize-none rounded-2xl bg-base-200"
              placeholder="Nudge the dream..."
              @keydown.enter.exact.prevent="sendChatMessage"
            />

            <button
              class="btn btn-primary min-h-16 rounded-2xl text-white"
              type="button"
              :disabled="dreamStore.isSaving || !chatMessage.trim()"
              @click="sendChatMessage"
            >
              Send
            </button>
          </div>
        </div>
      </section>

      <aside class="flex min-h-0 flex-col gap-4 overflow-y-auto">
        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="text-lg font-bold text-base-content">Chat Context</h2>

          <p
            class="mt-2 whitespace-pre-wrap rounded-2xl bg-base-200 p-3 text-sm text-base-content/70"
          >
            {{ dreamStore.dreamForm.currentVibe || 'No vibe set.' }}
          </p>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="text-lg font-bold text-base-content">Quick Actions</h2>

          <div class="mt-3 grid grid-cols-1 gap-2">
            <button
              class="btn btn-sm btn-outline rounded-2xl"
              type="button"
              @click="copyVibeToChat"
            >
              Vibe → Chat
            </button>

            <button
              class="btn btn-sm btn-outline rounded-2xl"
              type="button"
              @click="copyPromptToChat"
            >
              Prompt → Chat
            </button>
          </div>
        </section>
      </aside>
    </section>

    <section
      v-else-if="activeMode === 'image'"
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
    >
      <section
        class="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <div>
          <h2 class="text-xl font-bold text-base-content">Image Prompt</h2>

          <p class="text-sm text-base-content/60">
            Generate a new image and attach it to the dream.
          </p>
        </div>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Prompt</span>
            <span class="label-text-alt text-base-content/50"
              >image-facing</span
            >
          </span>

          <textarea
            v-model="imagePrompt"
            class="textarea textarea-bordered min-h-44 resize-none rounded-2xl bg-base-200"
            placeholder="Describe the next image in the dream..."
          />
        </label>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            class="btn btn-outline rounded-2xl"
            type="button"
            @click="copyVibeToImagePrompt"
          >
            Vibe → Image
          </button>

          <button
            class="btn btn-outline rounded-2xl"
            type="button"
            @click="copyPromptToImagePrompt"
          >
            Prompt → Image
          </button>

          <button
            class="btn btn-secondary rounded-2xl"
            type="button"
            @click="seedImagePrompt"
          >
            Random
          </button>
        </div>

        <button
          class="btn btn-primary rounded-2xl text-white"
          type="button"
          :disabled="isGeneratingArt || !imagePrompt.trim()"
          @click="generateDreamArt"
        >
          <span
            v-if="isGeneratingArt"
            class="loading loading-spinner loading-xs"
          />
          {{ isGeneratingArt ? 'Generating...' : 'Generate Dream Image' }}
        </button>
      </section>

      <aside class="flex min-h-0 flex-col gap-4 overflow-hidden">
        <section
          class="overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="border-b border-base-300 p-4">
            <h2 class="text-lg font-bold text-base-content">Current Image</h2>
          </div>

          <div class="bg-base-200 p-3">
            <img
              v-if="activeImage"
              :src="activeImage"
              :alt="dreamStore.selectedDream?.title || 'Dream image'"
              class="h-72 w-full rounded-2xl object-cover"
            />

            <div
              v-else
              class="flex h-72 items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 via-secondary/10 to-accent/10"
            >
              <Icon name="kind-icon:moon" class="h-16 w-16 text-primary" />
            </div>
          </div>
        </section>

        <section
          class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="border-b border-base-300 p-4">
            <h2 class="text-lg font-bold text-base-content">Image History</h2>
          </div>

          <div class="min-h-0 h-full overflow-y-auto p-3">
            <dream-list image-only />
          </div>
        </section>
      </aside>
    </section>

    <section
      v-else
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
    >
      <section
        class="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <div>
          <h2 class="text-xl font-bold text-base-content">Prompt Controls</h2>

          <p class="text-sm text-base-content/60">
            Sync the dream vibe, dream prompt, and global prompt field.
          </p>
        </div>

        <label class="form-control">
          <span class="label-text font-bold">Current Vibe</span>

          <textarea
            v-model="localVibe"
            class="textarea textarea-bordered min-h-36 resize-none rounded-2xl bg-base-200"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Current Prompt</span>

          <textarea
            v-model="localPrompt"
            class="textarea textarea-bordered min-h-36 resize-none rounded-2xl bg-base-200"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Prompt Store</span>

          <textarea
            v-model="promptStore.promptField"
            class="textarea textarea-bordered min-h-28 resize-none rounded-2xl bg-base-200"
          />
        </label>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            class="btn btn-sm btn-outline rounded-2xl"
            type="button"
            @click="copyVibeToPrompt"
          >
            Vibe → Prompt
          </button>

          <button
            class="btn btn-sm btn-outline rounded-2xl"
            type="button"
            @click="copyPromptStoreToDream"
          >
            Store → Dream
          </button>

          <button
            class="btn btn-sm btn-outline rounded-2xl"
            type="button"
            @click="copyDreamPromptToPromptStore"
          >
            Dream → Store
          </button>
        </div>

        <button
          class="btn btn-primary rounded-2xl text-white"
          type="button"
          :disabled="dreamStore.isSaving || !localVibe.trim()"
          @click="savePromptState"
        >
          Save Prompt State
        </button>
      </section>

      <aside class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <h2 class="text-lg font-bold text-base-content">Prompt Preview</h2>

        <pre
          class="mt-3 whitespace-pre-wrap rounded-2xl bg-base-200 p-3 text-sm text-base-content/75"
          >{{ promptPreview }}</pre
        >
      </aside>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useDreamStore } from '@/stores/dreamStore'
import { usePromptStore } from '@/stores/promptStore'
import { useServerStore } from '@/stores/serverStore'
import { useCheckpointStore } from '@/stores/checkpointStore'

type DreamInteractMode = 'shared' | 'chat' | 'image' | 'prompts'

const dreamStore = useDreamStore()
const promptStore = usePromptStore()
const artStore = useArtStore()
const serverStore = useServerStore()
const checkpointStore = useCheckpointStore()
const errorStore = useErrorStore()

const activeMode = ref<DreamInteractMode>('shared')
const introText = ref('')
const chatMessage = ref('')
const imagePrompt = ref('')
const localVibe = ref('')
const localPrompt = ref('')
const isGeneratingArt = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const modeTabs: Array<{
  key: DreamInteractMode
  label: string
  icon: string
}> = [
  { key: 'shared', label: 'Shared', icon: 'kind-icon:sparkles' },
  { key: 'chat', label: 'Chat', icon: 'kind-icon:chat' },
  { key: 'image', label: 'Image', icon: 'kind-icon:palette' },
  { key: 'prompts', label: 'Prompts', icon: 'kind-icon:quote' },
]

const activeArtServerName = computed(
  () =>
    serverStore.activeArtServer?.label ||
    serverStore.activeArtServer?.title ||
    'No art server selected',
)

const activeTextServerName = computed(
  () =>
    serverStore.activeTextServer?.label ||
    serverStore.activeTextServer?.title ||
    'No text server selected',
)

const activeImage = computed(() => {
  return (
    dreamStore.selectedDream?.Art?.imagePath ||
    dreamStore.selectedDreamCurrentImage ||
    ''
  )
})

const activePrompt = computed(() => {
  return (
    imagePrompt.value ||
    localPrompt.value ||
    dreamStore.dreamForm.currentPrompt ||
    dreamStore.dreamForm.currentVibe ||
    promptStore.promptField ||
    ''
  )
})

const promptPreview = computed(() => {
  return [
    `Dream: ${dreamStore.selectedDream?.title || dreamStore.dreamForm.title || 'Untitled Dream'}`,
    `Vibe: ${localVibe.value || 'No vibe set.'}`,
    `Prompt: ${localPrompt.value || localVibe.value || 'No prompt set.'}`,
    promptStore.promptField ? `PromptStore: ${promptStore.promptField}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
})

function syncLocalFromStore() {
  localVibe.value = dreamStore.dreamForm.currentVibe || ''
  localPrompt.value =
    dreamStore.dreamForm.currentPrompt || dreamStore.dreamForm.currentVibe || ''

  if (!imagePrompt.value) {
    imagePrompt.value = localPrompt.value || localVibe.value
  }
}

function commitPromptState() {
  dreamStore.setDreamForm({
    currentVibe: localVibe.value,
    currentPrompt: localPrompt.value || localVibe.value || null,
  })
}

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

async function ensureDream() {
  if (dreamStore.selectedDream?.id) return dreamStore.selectedDream

  const seed =
    introText.value.trim() ||
    localVibe.value.trim() ||
    imagePrompt.value.trim() ||
    dreamStore.randomDream()

  dreamStore.startAddingDream({
    title: dreamStore.dreamForm.title || 'Untitled Dream',
    currentVibe: seed,
    currentPrompt: imagePrompt.value.trim() || seed,
    textServerId: serverStore.activeTextServer?.id ?? null,
    artServerId: serverStore.activeArtServer?.id ?? null,
    createCollection: true,
    isPublic: true,
    isMature: false,
  })

  const result = await dreamStore.saveDream()

  if (!result.success || !result.data) {
    throw new Error(result.message || 'Failed to create dream.')
  }

  return result.data
}

function startFreshDream() {
  const seed = dreamStore.randomDream()

  dreamStore.startAddingDream({
    title: '',
    currentVibe: seed,
    currentPrompt: seed,
    textServerId: serverStore.activeTextServer?.id ?? null,
    artServerId: serverStore.activeArtServer?.id ?? null,
    createCollection: true,
  })

  introText.value = seed
  localVibe.value = seed
  localPrompt.value = seed
  imagePrompt.value = seed
  promptStore.promptField = seed
  setStatus('Fresh dream seed loaded.')
}

function seedIntro() {
  const seed = dreamStore.randomDream()
  introText.value = seed
  setStatus('Intro seeded.')
}

function seedImagePrompt() {
  const seed = dreamStore.randomDream()
  imagePrompt.value = seed
  setStatus('Image prompt seeded.')
}

function copyIntroToPrompt() {
  localVibe.value = introText.value
  localPrompt.value = introText.value
  imagePrompt.value = introText.value
  promptStore.promptField = introText.value
  commitPromptState()
  setStatus('Intro copied into prompt state.')
}

function copyVibeToChat() {
  chatMessage.value = dreamStore.dreamForm.currentVibe || localVibe.value || ''
}

function copyPromptToChat() {
  chatMessage.value =
    dreamStore.dreamForm.currentPrompt || localPrompt.value || ''
}

function copyVibeToImagePrompt() {
  imagePrompt.value = dreamStore.dreamForm.currentVibe || localVibe.value || ''
}

function copyPromptToImagePrompt() {
  imagePrompt.value =
    dreamStore.dreamForm.currentPrompt ||
    localPrompt.value ||
    promptStore.promptField ||
    ''
}

function copyVibeToPrompt() {
  localPrompt.value = localVibe.value
  promptStore.promptField = localVibe.value
  commitPromptState()
}

function copyPromptStoreToDream() {
  localPrompt.value = promptStore.promptField
  commitPromptState()
}

function copyDreamPromptToPromptStore() {
  promptStore.promptField = localPrompt.value || localVibe.value || ''
}

async function sendIntroText() {
  if (!introText.value.trim()) return

  try {
    const dream = await ensureDream()

    localVibe.value = introText.value.trim()
    localPrompt.value = localPrompt.value || introText.value.trim()
    commitPromptState()

    await dreamStore.updateSelectedDream({
      currentVibe: localVibe.value,
      currentPrompt: localPrompt.value || localVibe.value,
      textServerId: serverStore.activeTextServer?.id ?? null,
      artServerId: serverStore.activeArtServer?.id ?? null,
    })

    const result = await dreamStore.addUserDreamMessage(
      introText.value,
      dream.id,
    )

    if (!result.success) {
      throw new Error(result.message || 'Failed to send intro.')
    }

    introText.value = ''
    await refreshChats()
    setStatus('Intro sent.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to send intro.',
      'error',
    )
  }
}

async function sendChatMessage() {
  if (!chatMessage.value.trim()) return

  try {
    const dream = await ensureDream()
    const message = chatMessage.value.trim()

    const result = await dreamStore.addUserDreamMessage(message, dream.id)

    if (!result.success) {
      throw new Error(result.message || 'Failed to send message.')
    }

    chatMessage.value = ''
    await refreshChats()
    setStatus('Dream nudge sent.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to send message.',
      'error',
    )
  }
}

async function savePromptState() {
  if (!localVibe.value.trim()) return

  try {
    await ensureDream()
    commitPromptState()

    const result = await dreamStore.updateSelectedDream({
      currentVibe: localVibe.value,
      currentPrompt: localPrompt.value || null,
      textServerId: serverStore.activeTextServer?.id ?? null,
      artServerId: serverStore.activeArtServer?.id ?? null,
    })

    if (!result.success) {
      throw new Error(result.message || 'Failed to save prompt state.')
    }

    await dreamStore.addModelDreamMessage('Dream prompt updated.', {
      currentVibe: localVibe.value,
      currentPrompt: localPrompt.value || null,
      updateDream: true,
      serverId: serverStore.activeTextServer?.id ?? null,
      serverName: serverStore.activeTextServer?.title ?? null,
    })

    await refreshChats()
    setStatus('Prompt state saved.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to save prompt state.',
      'error',
    )
  }
}

async function generateDreamArt() {
  if (!imagePrompt.value.trim()) return

  isGeneratingArt.value = true
  statusMessage.value = ''

  try {
    const dream = await ensureDream()
    const activeServer = serverStore.activeArtServer

    const result = await artStore.generateArt({
      promptString: imagePrompt.value.trim(),
      serverId: dream.artServerId ?? activeServer?.id ?? undefined,
      serverName: activeServer?.title,
      checkpoint: checkpointStore.selectedCheckpoint?.name ?? undefined,
      collectionId: dream.artCollectionId ?? undefined,
    } as Parameters<typeof artStore.generateArt>[0])

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Art generation failed.')
    }

    const art = result.data as {
      id: number
      artImageId?: number | null
      imagePath?: string | null
      promptString?: string | null
    }

    await dreamStore.addModelDreamMessage('A new image entered the dream.', {
      artId: art.id,
      artImageId: art.artImageId ?? null,
      currentPrompt: imagePrompt.value.trim(),
      currentVibe:
        localVibe.value || dream.currentVibe || imagePrompt.value.trim(),
      updateDream: true,
      addArtToCollection: true,
      serverId: dream.artServerId ?? activeServer?.id ?? null,
      serverName: activeServer?.title ?? null,
      dreamId: dream.id,
    })

    await dreamStore.fetchDreamById(dream.id, true)
    await refreshChats()
    setStatus('Dream image generated.')
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Dream art generation failed.'

    errorStore.addError(ErrorType.GENERAL_ERROR, message)
    setStatus(message, 'error')
  } finally {
    isGeneratingArt.value = false
  }
}

async function refreshChats() {
  if (!dreamStore.selectedDream?.id) return

  await dreamStore.fetchDreamChats(dreamStore.selectedDream.id)
}

watch(
  () => dreamStore.selectedDream?.id,
  async (id) => {
    syncLocalFromStore()

    if (id) {
      await dreamStore.fetchDreamChats(id)
    }
  },
)

watch(
  () => dreamStore.dreamForm.currentPrompt,
  (prompt) => {
    if (typeof prompt === 'string' && prompt !== promptStore.promptField) {
      promptStore.promptField = prompt
    }
  },
)

watch([localVibe, localPrompt], () => {
  commitPromptState()
})

onMounted(async () => {
  await Promise.all([
    dreamStore.initialize(),
    serverStore.initialize({
      fetchRemote: true,
    }),
    checkpointStore.initialize(),
  ])

  syncLocalFromStore()

  if (dreamStore.selectedDream?.id) {
    await dreamStore.fetchDreamChats(dreamStore.selectedDream.id)
  }

  if (!introText.value) {
    introText.value = dreamStore.dreamForm.currentVibe || ''
  }

  if (!imagePrompt.value) {
    imagePrompt.value =
      dreamStore.dreamForm.currentPrompt ||
      dreamStore.dreamForm.currentVibe ||
      ''
  }
})
</script>
