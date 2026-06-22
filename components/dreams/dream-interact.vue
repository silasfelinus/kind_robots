<!-- /components/dreams/dream-interact.vue -->
<template>
  <dream-gallery
    v-if="!dreamStore.selectedDream"
    class="h-full min-h-0"
    variant="dashboard"
    title="Choose a Dream"
    subtitle="Pick a Dream to open its workspace."
    :open-on-select="false"
  />

  <section
    v-else
    class="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
  >
    <div
      v-if="wallpaperUrl"
      class="pointer-events-none absolute inset-0 opacity-20 blur-[1px]"
      :style="{
        backgroundImage: `url(${wallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }"
    />

    <header
      class="relative z-10 shrink-0 border-b border-base-300 bg-base-100/95 px-2 py-2 backdrop-blur"
    >
      <div class="flex min-w-0 items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm shrink-0 rounded-xl"
            title="Back to all Dreams"
            @click="backToGallery"
          >
            <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
            <span class="hidden sm:inline">All Dreams</span>
          </button>

          <div
            class="hidden h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-300 sm:block"
          >
            <img
              v-if="wallpaperUrl"
              :src="wallpaperUrl"
              :alt="dreamTitle"
              class="h-full w-full object-cover"
            />

            <div
              v-else
              class="flex h-full w-full items-center justify-center text-primary"
            >
              <Icon name="kind-icon:dream" class="h-5 w-5" />
            </div>
          </div>

          <div class="min-w-0">
            <div class="flex min-w-0 items-center gap-1.5">
              <h1 class="truncate text-base font-black text-primary sm:text-lg">
                {{ dreamTitle }}
              </h1>

              <span
                v-if="dreamStore.selectedDream"
                class="badge badge-outline badge-sm shrink-0 rounded-xl"
              >
                #{{ dreamStore.selectedDream.id }}
              </span>

              <span
                v-if="dreamStore.selectedDream"
                class="badge badge-sm shrink-0 rounded-xl"
                :class="
                  dreamStore.selectedDream.isPublic
                    ? 'badge-primary'
                    : 'badge-ghost'
                "
              >
                {{ dreamStore.selectedDream.isPublic ? 'Public' : 'Private' }}
              </span>
            </div>

            <p class="max-w-[70vw] truncate text-xs text-base-content/60">
              {{ selectedSummary }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            class="btn btn-ghost btn-sm tooltip tooltip-bottom rounded-xl"
            :disabled="!dreamStore.selectedDreamId || dreamStore.loading"
            data-tip="Refresh Dream"
            aria-label="Refresh Dream"
            @click="refreshDream"
          >
            <span
              v-if="dreamStore.loading"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          </button>

          <button
            type="button"
            class="btn btn-outline btn-sm tooltip tooltip-bottom rounded-xl"
            :disabled="!dreamStore.selectedDreamId"
            data-tip="Edit Dream"
            aria-label="Edit Dream"
            @click="editDream"
          >
            <Icon name="kind-icon:edit" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>

    <main
      class="relative z-10 grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 xl:grid-cols-[minmax(0,1fr)_24rem]"
    >
      <section
        class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <nav
          class="flex shrink-0 flex-wrap gap-2 border-b border-base-300 bg-base-200 p-3"
        >
          <button
            v-for="panel in panels"
            :key="panel.key"
            type="button"
            class="btn btn-sm rounded-2xl"
            :class="
              activePanel === panel.key ? 'btn-primary text-white' : 'btn-ghost'
            "
            @click="activePanel = panel.key"
          >
            <Icon :name="panel.icon" class="h-4 w-4" />
            {{ panel.label }}
          </button>
        </nav>

        <section class="min-h-0 overflow-y-auto p-3">
          <div
            v-if="activePanel === 'chat'"
            class="flex min-h-full flex-col gap-3"
          >
            <div
              class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div>
                <h2 class="font-black">Dream Chat</h2>
                <p class="text-xs text-base-content/60">
                  Start a public or private chatroom-style thread attached to
                  this Dream.
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn btn-xs rounded-2xl"
                  :class="
                    chatIsPublic ? 'btn-primary text-white' : 'btn-outline'
                  "
                  @click="chatIsPublic = true"
                >
                  Public
                </button>

                <button
                  type="button"
                  class="btn btn-xs rounded-2xl"
                  :class="!chatIsPublic ? 'btn-secondary' : 'btn-outline'"
                  @click="chatIsPublic = false"
                >
                  Private
                </button>

                <button
                  type="button"
                  class="btn btn-xs btn-outline rounded-2xl"
                  :disabled="dreamStore.chatsLoading"
                  @click="refreshChats"
                >
                  Load
                </button>
              </div>
            </div>

            <div
              ref="chatScrollRef"
              class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div
                v-if="dreamStore.selectedDreamChats.length"
                class="grid gap-2"
              >
                <article
                  v-for="chat in dreamStore.selectedDreamChats"
                  :key="chat.id"
                  class="rounded-2xl border p-3"
                  :class="
                    chat.type === 'BotResponse'
                      ? 'border-info/40 bg-info/10'
                      : 'border-base-300 bg-base-100'
                  "
                >
                  <div
                    class="flex flex-wrap items-center justify-between gap-2"
                  >
                    <p class="font-bold text-primary">
                      {{ chat.sender || chat.User?.username || 'Dreamer' }}
                    </p>

                    <div class="flex flex-wrap gap-1">
                      <span class="badge badge-xs rounded-xl">{{
                        chat.type
                      }}</span>
                      <span
                        v-if="chat.isPublic === false"
                        class="badge badge-secondary badge-xs rounded-xl"
                      >
                        Private
                      </span>
                    </div>
                  </div>

                  <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {{ chat.content || chat.botResponse }}
                  </p>
                </article>
              </div>

              <div
                v-else
                class="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center text-base-content/50"
              >
                No chat yet. Start the room with a first message.
              </div>
            </div>
          </div>

          <div v-else-if="activePanel === 'art'" class="grid gap-3">
            <dream-art-chooser />

            <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 class="font-black">Dream Art</h2>
                  <p class="text-xs text-base-content/60">
                    Generate art around the selected Dream concept using the art
                    store.
                  </p>
                </div>

                <button
                  type="button"
                  class="btn btn-primary btn-sm rounded-2xl text-white"
                  :disabled="isGeneratingArt || !artPrompt.trim()"
                  @click="generateArtImage"
                >
                  <span
                    v-if="isGeneratingArt"
                    class="loading loading-spinner loading-xs"
                  />
                  <Icon v-else name="kind-icon:image" class="h-4 w-4" />
                  Generate Art
                </button>
              </div>

              <textarea
                v-model="artPrompt"
                class="textarea textarea-bordered mt-3 min-h-36 w-full rounded-2xl bg-base-100 leading-relaxed"
                placeholder="Describe the art to generate for this Dream..."
              />

              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline rounded-2xl"
                  @click="useDreamAsArtPrompt"
                >
                  <Icon name="kind-icon:copy" class="h-4 w-4" />
                  Use Dream
                </button>

                <button
                  type="button"
                  class="btn btn-sm btn-secondary rounded-2xl"
                  :disabled="!artPrompt.trim()"
                  @click="saveArtPrompt"
                >
                  <Icon name="kind-icon:save" class="h-4 w-4" />
                  Save Prompt
                </button>
              </div>
            </section>

            <dream-list list-type="art" view-mode="grid" />
          </div>

          <div v-else class="grid gap-3">
            <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <h2 class="font-black">Dream Assets</h2>
              <p class="mt-1 text-sm text-base-content/60">
                Cast, rewards, scenario hooks, and generated art that orbit this
                Dream.
              </p>
            </section>

            <dream-list
              list-type="cast"
              view-mode="grid"
              :show-refresh="false"
            />
            <dream-list
              list-type="items"
              view-mode="grid"
              :show-refresh="false"
            />
          </div>
        </section>

        <footer
          class="grid shrink-0 gap-2 border-t border-base-300 bg-base-100 p-3 md:grid-cols-[minmax(0,1fr)_auto]"
        >
          <textarea
            v-model="message"
            class="textarea textarea-bordered min-h-16 resize-none rounded-2xl bg-base-200"
            :placeholder="
              chatIsPublic
                ? 'Post a public Dream message...'
                : 'Post a private Dream message...'
            "
            @keydown.ctrl.enter.prevent="submitMessage"
            @keydown.meta.enter.prevent="submitMessage"
          />

          <button
            type="button"
            class="btn btn-primary rounded-2xl text-white"
            :disabled="dreamStore.isSaving || !canSubmit"
            @click="submitMessage"
          >
            <span
              v-if="dreamStore.isSaving"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:send" class="h-4 w-4" />
            Send
          </button>
        </footer>
      </section>

      <aside
        class="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 overflow-hidden"
      >
        <section class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <h2 class="text-lg font-black text-primary">Concept</h2>
          <p
            class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/70"
          >
            {{
              dreamStore.selectedDream.pitch ||
              dreamStore.selectedDream.description ||
              dreamStore.selectedDream.flavorText
            }}
          </p>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <h2 class="text-lg font-black text-primary">Model Status</h2>
          <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div class="rounded-xl bg-base-200 p-2">
              <p class="font-black text-info">{{ serverCount }}</p>
              <p class="text-xs text-base-content/50">Servers</p>
            </div>

            <div class="rounded-xl bg-base-200 p-2">
              <p class="font-black text-accent">
                {{ dreamStore.selectedDreamCollectionArt.length }}
              </p>
              <p class="text-xs text-base-content/50">Art</p>
            </div>

            <div class="rounded-xl bg-base-200 p-2">
              <p class="font-black text-secondary">
                {{ dreamStore.selectedDreamCast.length }}
              </p>
              <p class="text-xs text-base-content/50">Cast</p>
            </div>

            <div class="rounded-xl bg-base-200 p-2">
              <p class="font-black text-primary">
                {{ dreamStore.selectedDreamItems.length }}
              </p>
              <p class="text-xs text-base-content/50">Items</p>
            </div>
          </div>
        </section>

        <dream-list class="min-h-0" list-type="chats" />
      </aside>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type PanelKey = 'chat' | 'art' | 'assets'

type ServerStoreLike = {
  servers?: unknown[]
  textServers?: unknown[]
  artServers?: unknown[]
}

const dreamStore = useDreamStore()
const artStore = useArtStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const message = ref('')
const activePanel = ref<PanelKey>('chat')
const chatIsPublic = ref(true)
const artPrompt = ref('')
const isGeneratingArt = ref(false)
const chatScrollRef = ref<HTMLElement | null>(null)

const panels: { key: PanelKey; label: string; icon: string }[] = [
  { key: 'chat', label: 'Chat', icon: 'kind-icon:chat' },
  { key: 'art', label: 'Art', icon: 'kind-icon:image' },
  { key: 'assets', label: 'Assets', icon: 'kind-icon:inventory' },
]

const dreamTitle = computed(() => {
  return dreamStore.selectedDream?.title || 'No Dream Selected'
})

const selectedSummary = computed(() => {
  return dreamStore.selectedDreamSummary
})

const canSubmit = computed(() => {
  return Boolean(dreamStore.selectedDreamId && message.value.trim())
})

const wallpaperUrl = computed(() => {
  const firstCollectionImage = dreamStore.selectedDreamCollectionArt.find(
    (art) => {
      return art.imagePath || art.path || art.fileName
    },
  )

  return (
    dreamStore.selectedDreamCurrentImage ||
    firstCollectionImage?.imagePath ||
    firstCollectionImage?.path ||
    firstCollectionImage?.fileName ||
    ''
  )
})

const serverCount = computed(() => {
  const store = serverStore as unknown as ServerStoreLike
  return (
    (store.servers?.length ?? 0) +
    (store.textServers?.length ?? 0) +
    (store.artServers?.length ?? 0)
  )
})

watch(
  () => dreamStore.selectedDream?.id,
  async () => {
    syncFromSelectedDream()
    await refreshChats()
  },
)

watch(
  () => dreamStore.selectedDreamChats.length,
  () => nextTick(scrollChatToBottom),
)

onMounted(async () => {
  await dreamStore.initialize()
  await serverStore.initialize?.({ fetchRemote: true })
  syncFromSelectedDream()
  await refreshChats()
})

function syncFromSelectedDream() {
  const dream = dreamStore.selectedDream
  if (!dream) return

  chatIsPublic.value = dream.isPublic ?? true
  artPrompt.value =
    dream.artPrompt ||
    dream.pitch ||
    dream.description ||
    dream.flavorText ||
    ''
}

function requireSelectedDream() {
  if (dreamStore.selectedDreamId) return true

  dreamStore.reportError(
    new Error('No Dream selected.'),
    'using Dream interact',
    'Select a Dream first.',
  )
  return false
}

async function refreshDream() {
  if (!dreamStore.selectedDreamId) return

  await dreamStore.fetchDreamById(dreamStore.selectedDreamId, true)
  syncFromSelectedDream()
}

async function refreshChats() {
  if (!dreamStore.selectedDreamId) return

  await dreamStore.fetchDreamChats({ dreamId: dreamStore.selectedDreamId })
  await nextTick()
  scrollChatToBottom()
}

function scrollChatToBottom() {
  if (!chatScrollRef.value) return

  chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
}

async function submitMessage() {
  const content = message.value.trim()
  if (!content || !requireSelectedDream()) return

  const result = await dreamStore.addDreamChat(dreamStore.selectedDreamId!, {
    type: 'Dream',
    sender: userStore.username || 'Dreamer',
    content,
    isPublic: chatIsPublic.value,
    isMature: dreamStore.selectedDream?.isMature ?? false,
  })

  if (!result.success) return

  message.value = ''
  await nextTick()
  scrollChatToBottom()
}

function useDreamAsArtPrompt() {
  const dream = dreamStore.selectedDream
  if (!dream) return

  artPrompt.value = [
    dream.artPrompt,
    dream.pitch,
    dream.description,
    dream.flavorText,
  ]
    .filter(Boolean)
    .join('\n\n')
}

async function saveArtPrompt() {
  if (!requireSelectedDream()) return

  await dreamStore.updateSelectedDream({
    artPrompt: artPrompt.value,
    updateNote: 'Dream art prompt updated.',
  })
}

async function generateArtImage() {
  if (!requireSelectedDream()) return

  const prompt = artPrompt.value.trim()
  if (!prompt) return

  isGeneratingArt.value = true

  try {
    promptStore.promptField = prompt
    promptStore.currentPrompt = prompt
    promptStore.syncToLocalStorage?.()

    const result = await artStore.generateArt({
      promptString: prompt,
      dreamId: dreamStore.selectedDreamId,
      userId: userStore.userId || 10,
      designer: userStore.username || 'Kind Designer',
      isPublic: dreamStore.selectedDream?.isPublic ?? true,
      isMature: dreamStore.selectedDream?.isMature ?? false,
    } as Parameters<typeof artStore.generateArt>[0])

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Art generation failed.')
    }

    const artImageId = Number((result.data as { id?: number }).id)

    await dreamStore.updateSelectedDream({
      artPrompt: prompt,
      artImageId:
        Number.isInteger(artImageId) && artImageId > 0 ? artImageId : undefined,
      artCollectionId: dreamStore.selectedDream?.artCollectionId ?? null,
      addArtToCollection: true,
      updateNote: 'Generated Dream art.',
    })

    await dreamStore.addModelDreamMessage(`Generated Dream art:\n${prompt}`, {
      type: 'BotResponse',
      artImageId:
        Number.isInteger(artImageId) && artImageId > 0 ? artImageId : null,
      isPublic: dreamStore.selectedDream?.isPublic ?? true,
      isMature: dreamStore.selectedDream?.isMature ?? false,
    })

    await refreshDream()
  } catch (error) {
    dreamStore.reportError(
      error,
      'generating Dream art',
      'Art generation failed.',
    )
  } finally {
    isGeneratingArt.value = false
  }
}

async function editDream() {
  if (!dreamStore.selectedDreamId) return

  await dreamStore.startEditingDream(dreamStore.selectedDreamId)
  navStore.setDashboardTab?.('dream', 'dreammaker')
}

function backToGallery() {
  dreamStore.deselectDream?.()
}
</script>
