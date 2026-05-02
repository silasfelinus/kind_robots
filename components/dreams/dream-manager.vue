<!-- /components/dreams/dream-manager.vue -->
<template>
  <section class="h-full w-full">
    <div
      class="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3 sm:p-6"
    >
      <header
        class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <div
          class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
        >
          <div class="min-w-0">
            <h1 class="text-2xl font-black text-primary sm:text-3xl">
              🌙 Dream Manager
            </h1>
            <p class="mt-1 text-sm text-base-content/70 sm:text-base">
              Shape a shared dream through chat, prompts, art, collections, and
              model servers.
            </p>
          </div>

          <div class="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              class="btn btn-sm btn-secondary rounded-2xl"
              @click="seedDream"
            >
              <Icon name="kind-icon:dice" class="h-5 w-5" />
              Seed
            </button>

            <button
              type="button"
              class="btn btn-sm btn-primary rounded-2xl text-white"
              :disabled="
                dreamStore.isSaving || !dreamStore.dreamForm.currentVibe?.trim()
              "
              @click="saveDream"
            >
              <span
                v-if="dreamStore.isSaving"
                class="loading loading-spinner loading-xs"
              />
              Save Dream
            </button>
          </div>
        </div>
      </header>

      <nav
        class="shrink-0 overflow-x-auto rounded-2xl border border-base-300 bg-base-100 p-2"
      >
        <div class="flex min-w-max gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="btn btn-sm rounded-2xl"
            :class="
              activeTab === tab.id
                ? 'btn-primary text-white'
                : 'btn-ghost hover:bg-base-200'
            "
            @click="setTab(tab.id)"
          >
            <Icon :name="tab.icon" class="h-5 w-5" />
            {{ tab.label }}
          </button>
        </div>
      </nav>

      <div
        class="grid shrink-0 grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 xl:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)_auto]"
      >
        <label class="form-control">
          <span class="label-text font-bold">Active Dream</span>
          <select
            v-model.number="selectedDreamId"
            class="select select-bordered rounded-2xl"
            @change="selectDream"
          >
            <option :value="0">New or choose dream</option>
            <option
              v-for="dream in dreamStore.dreams"
              :key="dream.id"
              :value="dream.id"
            >
              {{ dream.title || `Dream ${dream.id}` }}
            </option>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Title</span>
          <input
            v-model="dreamStore.dreamForm.title"
            class="input input-bordered rounded-2xl"
            placeholder="Untitled Dream"
          />
        </label>

        <div class="flex items-end gap-2">
          <button
            type="button"
            class="btn btn-outline rounded-2xl"
            @click="newDream"
          >
            New
          </button>

          <button
            type="button"
            class="btn btn-error rounded-2xl text-white"
            :disabled="!dreamStore.selectedDream?.id || dreamStore.isDeleting"
            @click="deleteDream"
          >
            Delete
          </button>
        </div>
      </div>

      <div
        v-if="lastResult"
        class="shrink-0 rounded-2xl border px-4 py-3 text-sm"
        :class="
          lastResult.success
            ? 'border-success/30 bg-success/10 text-success'
            : 'border-error/30 bg-error/10 text-error'
        "
      >
        {{ lastResult.message }}
      </div>

      <main class="min-h-0 flex-1 overflow-hidden">
        <section
          v-if="activeTab === 'cockpit'"
          class="grid h-full min-h-0 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12"
        >
          <div class="min-h-0 xl:col-span-4">
            <div
              class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
            >
              <div class="shrink-0 border-b border-base-300 p-4">
                <h2 class="text-lg font-black text-primary">Dream State</h2>
                <p class="text-sm text-base-content/60">
                  The live text and visual direction.
                </p>
              </div>

              <div
                class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
              >
                <label class="form-control">
                  <span class="label-text font-bold">Current Vibe</span>
                  <textarea
                    v-model="dreamStore.dreamForm.currentVibe"
                    class="textarea textarea-bordered min-h-40 resize-none rounded-2xl"
                    placeholder="What is happening in the dream right now?"
                  />
                </label>

                <label class="form-control">
                  <span class="label-text font-bold">Current Prompt</span>
                  <textarea
                    v-model="dreamStore.dreamForm.currentPrompt"
                    class="textarea textarea-bordered min-h-36 resize-none rounded-2xl"
                    placeholder="Prompt used by art/text modelers."
                  />
                </label>

                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-primary rounded-2xl text-white"
                    :disabled="
                      dreamStore.isSaving ||
                      !dreamStore.dreamForm.currentVibe?.trim()
                    "
                    @click="saveDream"
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    class="btn btn-sm btn-secondary rounded-2xl"
                    @click="copyVibeToPrompt"
                  >
                    Vibe → Prompt
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="min-h-0 xl:col-span-5">
            <div
              class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
            >
              <div
                class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 p-4"
              >
                <div>
                  <h2 class="text-lg font-black text-primary">Dream Chat</h2>
                  <p class="text-sm text-base-content/60">
                    Every meaningful action becomes history.
                  </p>
                </div>

                <button
                  type="button"
                  class="btn btn-xs btn-ghost rounded-2xl"
                  :disabled="!dreamStore.selectedDream?.id"
                  @click="refreshChats"
                >
                  Refresh
                </button>
              </div>

              <div class="min-h-0 flex-1 overflow-y-auto bg-base-200 p-3">
                <div
                  v-if="dreamStore.dreamChats.length"
                  class="flex flex-col gap-2"
                >
                  <article
                    v-for="chat in dreamStore.dreamChats"
                    :key="chat.id"
                    class="rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <div class="mb-1 flex items-center justify-between gap-2">
                      <div class="truncate text-xs font-bold text-primary">
                        {{ chat.sender || 'Dreamer' }}
                      </div>
                      <div class="shrink-0 text-[10px] text-base-content/40">
                        #{{ chat.id }}
                      </div>
                    </div>

                    <p
                      class="whitespace-pre-wrap text-sm leading-relaxed text-base-content/75"
                    >
                      {{ chat.content }}
                    </p>
                  </article>
                </div>

                <div
                  v-else
                  class="flex h-full min-h-40 items-center justify-center text-center text-sm text-base-content/45"
                >
                  No chat history yet. The dream is loading its dramatic
                  entrance.
                </div>
              </div>

              <div class="shrink-0 border-t border-base-300 bg-base-100 p-3">
                <div class="flex gap-2">
                  <textarea
                    v-model="chatMessage"
                    class="textarea textarea-bordered min-h-14 flex-1 resize-none rounded-2xl"
                    placeholder="Nudge the dream..."
                    :disabled="!dreamStore.selectedDream"
                    @keydown.enter.exact.prevent="sendChat"
                  />

                  <button
                    type="button"
                    class="btn btn-primary min-h-14 rounded-2xl text-white"
                    :disabled="
                      dreamStore.isSaving ||
                      !dreamStore.selectedDream ||
                      !chatMessage.trim()
                    "
                    @click="sendChat"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="min-h-0 xl:col-span-3">
            <div
              class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
            >
              <div class="shrink-0 border-b border-base-300 p-4">
                <h2 class="text-lg font-black text-primary">Model Actions</h2>
                <p class="text-sm text-base-content/60">
                  Generate, collect, and continue.
                </p>
              </div>

              <div
                class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
              >
                <div
                  class="overflow-hidden rounded-2xl border border-base-300 bg-base-200"
                >
                  <img
                    v-if="activeImage"
                    :src="activeImage"
                    :alt="dreamStore.selectedDream?.title || 'Dream image'"
                    class="h-44 w-full object-cover"
                  />
                  <div
                    v-else
                    class="flex h-44 items-center justify-center bg-linear-to-br from-primary/10 via-secondary/10 to-accent/10"
                  >
                    <Icon
                      name="kind-icon:moon"
                      class="h-16 w-16 text-primary"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  class="btn btn-primary rounded-2xl text-white"
                  :disabled="isGeneratingArt || !activePrompt.trim()"
                  @click="generateDreamArt"
                >
                  <span
                    v-if="isGeneratingArt"
                    class="loading loading-spinner loading-xs"
                  />
                  {{ isGeneratingArt ? 'Generating...' : 'Generate Art' }}
                </button>

                <button
                  type="button"
                  class="btn btn-secondary rounded-2xl"
                  :disabled="
                    !dreamStore.selectedDream?.id ||
                    !dreamStore.dreamForm.currentPrompt?.trim()
                  "
                  @click="recordPromptShift"
                >
                  Record Prompt Shift
                </button>

                <button
                  type="button"
                  class="btn btn-outline rounded-2xl"
                  :disabled="!dreamStore.selectedDream?.id"
                  @click="openGalleryTab"
                >
                  Browse Dreams
                </button>

                <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                  <div
                    class="text-xs font-bold uppercase tracking-wide text-base-content/50"
                  >
                    Collection
                  </div>
                  <div class="mt-1 text-sm font-semibold">
                    {{ dreamStore.selectedDream?.artCollectionId || 'None' }}
                  </div>
                  <p class="mt-1 text-xs text-base-content/55">
                    Curated dream art can live in the attached ArtCollection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          v-else-if="activeTab === 'gallery'"
          class="h-full min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-100"
        >
          <dream-gallery />
        </section>

        <section
          v-else-if="activeTab === 'prompts'"
          class="h-full min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-100"
        >
          <dream-prompts />
        </section>

        <section
          v-else-if="activeTab === 'collections'"
          class="h-full min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <collection-gallery />
        </section>

        <section
          v-else-if="activeTab === 'servers'"
          class="h-full min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <server-manager />
        </section>

        <section
          v-else
          class="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4 lg:grid-cols-2"
        >
          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <h2 class="text-lg font-black text-primary">Dream Settings</h2>

            <div class="mt-4 grid gap-3">
              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <span class="label-text font-bold">Public</span>
                <input
                  v-model="dreamStore.dreamForm.isPublic"
                  type="checkbox"
                  class="toggle toggle-success"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <span class="label-text font-bold">Mature</span>
                <input
                  v-model="dreamStore.dreamForm.isMature"
                  type="checkbox"
                  class="toggle toggle-warning"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <span class="label-text font-bold">Active</span>
                <input
                  v-model="dreamStore.dreamForm.isActive"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
              </label>
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <h2 class="text-lg font-black text-primary">Linked IDs</h2>

            <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label class="form-control">
                <span class="label-text font-bold">Pitch ID</span>
                <input
                  v-model.number="dreamStore.dreamForm.pitchId"
                  type="number"
                  min="1"
                  class="input input-bordered rounded-2xl"
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Collection ID</span>
                <input
                  v-model.number="dreamStore.dreamForm.artCollectionId"
                  type="number"
                  min="1"
                  class="input input-bordered rounded-2xl"
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Text Server ID</span>
                <input
                  v-model.number="dreamStore.dreamForm.textServerId"
                  type="number"
                  min="1"
                  class="input input-bordered rounded-2xl"
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Art Server ID</span>
                <input
                  v-model.number="dreamStore.dreamForm.artServerId"
                  type="number"
                  min="1"
                  class="input input-bordered rounded-2xl"
                />
              </label>
            </div>

            <button
              type="button"
              class="btn btn-primary mt-4 rounded-2xl text-white"
              :disabled="
                dreamStore.isSaving || !dreamStore.dreamForm.currentVibe?.trim()
              "
              @click="saveDream"
            >
              Save Settings
            </button>
          </div>
        </section>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/dreams/dream-manager.vue
import { computed, onMounted, ref, watch } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { useNavStore, type DreamDashboardTab } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useArtStore } from '@/stores/artStore'
import { useServerStore } from '@/stores/serverStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const dreamStore = useDreamStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const artStore = useArtStore()
const serverStore = useServerStore()
const checkpointStore = useCheckpointStore()
const errorStore = useErrorStore()

const selectedDreamId = ref(0)
const chatMessage = ref('')
const isGeneratingArt = ref(false)
const lastResult = ref<{ success: boolean; message: string } | null>(null)

const tabs: Array<{
  id: DreamDashboardTab
  label: string
  icon: string
}> = [
  { id: 'cockpit', label: 'Cockpit', icon: 'kind-icon:moon' },
  { id: 'gallery', label: 'Gallery', icon: 'kind-icon:gallery' },
  { id: 'prompts', label: 'Prompts', icon: 'kind-icon:quote' },
  { id: 'collections', label: 'Collections', icon: 'kind-icon:collection' },
  { id: 'servers', label: 'Servers', icon: 'kind-icon:server' },
  { id: 'settings', label: 'Settings', icon: 'kind-icon:gear' },
]

const activeTab = computed(() => navStore.dreamDashboardTab)

const activePrompt = computed(() => {
  return (
    dreamStore.dreamForm.currentPrompt ||
    dreamStore.dreamForm.currentVibe ||
    promptStore.promptField ||
    ''
  )
})

const activeImage = computed(() => {
  return (
    dreamStore.selectedDream?.Art?.imagePath ||
    dreamStore.selectedDreamCurrentImage ||
    ''
  )
})

function setTab(tab: DreamDashboardTab) {
  navStore.setDreamDashboardTab(tab)
}

function openGalleryTab() {
  setTab('gallery')
}

function seedDream() {
  const seed = dreamStore.randomDream()

  dreamStore.setDreamForm({
    currentVibe: seed,
    currentPrompt: seed,
  })

  if (!dreamStore.dreamForm.title?.trim()) {
    dreamStore.setDreamForm({
      title: 'Untitled Dream',
    })
  }

  promptStore.promptField = seed
}

function newDream() {
  const seed = dreamStore.randomDream()

  dreamStore.createNewDream({
    title: '',
    currentVibe: seed,
    currentPrompt: seed,
    createCollection: true,
    isPublic: true,
    isMature: false,
  })

  selectedDreamId.value = 0
  chatMessage.value = ''
  promptStore.promptField = seed
  lastResult.value = null
}

async function selectDream() {
  if (!selectedDreamId.value) {
    dreamStore.deselectDream()
    return
  }

  await dreamStore.selectDreamById(selectedDreamId.value)
  await dreamStore.fetchDreamChats(selectedDreamId.value)

  if (dreamStore.selectedDream?.currentPrompt) {
    promptStore.promptField = dreamStore.selectedDream.currentPrompt
  }
}

async function saveDream() {
  lastResult.value = null

  if (!dreamStore.dreamForm.currentPrompt && dreamStore.dreamForm.currentVibe) {
    dreamStore.dreamForm.currentPrompt = dreamStore.dreamForm.currentVibe
  }

  const result = await dreamStore.saveDream()

  lastResult.value = {
    success: result.success,
    message: result.success
      ? 'Dream saved.'
      : result.message || 'Dream save failed.',
  }

  if (result.success && result.data?.id) {
    selectedDreamId.value = result.data.id
    await dreamStore.fetchDreamChats(result.data.id)
  }
}

async function deleteDream() {
  if (!dreamStore.selectedDream?.id) return

  const id = dreamStore.selectedDream.id
  const result = await dreamStore.deleteDream(id)

  lastResult.value = {
    success: result.success,
    message: result.success
      ? 'Dream deleted.'
      : result.message || 'Dream delete failed.',
  }

  if (result.success) {
    selectedDreamId.value = 0
    chatMessage.value = ''
  }
}

function copyVibeToPrompt() {
  dreamStore.setDreamForm({
    currentPrompt: dreamStore.dreamForm.currentVibe || '',
  })

  promptStore.promptField = dreamStore.dreamForm.currentVibe || ''
}

async function sendChat() {
  if (!dreamStore.selectedDream?.id || !chatMessage.value.trim()) return

  const message = chatMessage.value.trim()
  const result = await dreamStore.addUserDreamMessage(message)

  lastResult.value = {
    success: result.success,
    message: result.success
      ? 'Dream nudge recorded.'
      : result.message || 'Chat failed.',
  }

  if (result.success) {
    chatMessage.value = ''
    await dreamStore.fetchDreamChats(dreamStore.selectedDream.id)
  }
}

async function refreshChats() {
  if (!dreamStore.selectedDream?.id) return
  await dreamStore.fetchDreamChats(dreamStore.selectedDream.id)
}

async function recordPromptShift() {
  if (!dreamStore.selectedDream?.id) return

  const prompt =
    dreamStore.dreamForm.currentPrompt || dreamStore.dreamForm.currentVibe || ''

  if (!prompt.trim()) return

  const result = await dreamStore.addModelDreamMessage(
    'Dream prompt updated.',
    {
      currentPrompt: prompt,
      currentVibe: dreamStore.dreamForm.currentVibe || prompt,
      updateDream: true,
    },
  )

  lastResult.value = {
    success: result.success,
    message: result.success
      ? 'Prompt shift recorded.'
      : result.message || 'Prompt shift failed.',
  }
}

async function generateDreamArt() {
  if (!activePrompt.value.trim()) return

  isGeneratingArt.value = true
  lastResult.value = null

  try {
    const activeServer = serverStore.activeArtServer

    const result = await artStore.generateArt({
      promptString: activePrompt.value,
      serverId:
        dreamStore.selectedDream?.artServerId ?? activeServer?.id ?? undefined,
      serverName: activeServer?.title,
      checkpoint: checkpointStore.selectedCheckpoint?.name ?? undefined,
      collectionId: dreamStore.selectedDream?.artCollectionId ?? undefined,
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
      currentPrompt: activePrompt.value,
      currentVibe: dreamStore.dreamForm.currentVibe || activePrompt.value,
      updateDream: true,
      addArtToCollection: true,
      serverId:
        dreamStore.selectedDream?.artServerId ?? activeServer?.id ?? null,
      serverName: activeServer?.title ?? null,
    })

    if (dreamStore.selectedDream?.id) {
      await dreamStore.fetchDreamById(dreamStore.selectedDream.id, true)
      await dreamStore.fetchDreamChats(dreamStore.selectedDream.id)
    }

    lastResult.value = {
      success: true,
      message: 'Dream art generated.',
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Dream art generation failed.'

    errorStore.addError(ErrorType.GENERAL_ERROR, message)

    lastResult.value = {
      success: false,
      message,
    }
  } finally {
    isGeneratingArt.value = false
  }
}

watch(
  () => dreamStore.selectedDream?.id,
  (id) => {
    selectedDreamId.value = id ?? 0
  },
  { immediate: true },
)

watch(
  () => dreamStore.dreamForm.currentPrompt,
  (prompt) => {
    if (typeof prompt === 'string') {
      promptStore.promptField = prompt
    }
  },
)

onMounted(async () => {
  await navStore.initialize()
  await dreamStore.initialize()

  if (!serverStore.isInitialized) {
    await serverStore.initialize()
  }

  await checkpointStore.initialize()

  if (dreamStore.selectedDream?.id) {
    selectedDreamId.value = dreamStore.selectedDream.id
    await dreamStore.fetchDreamChats(dreamStore.selectedDream.id)
  } else if (!dreamStore.dreamForm.currentVibe) {
    newDream()
  }
})
</script>
