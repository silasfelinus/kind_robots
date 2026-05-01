<!-- /components/navigation/dream-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full min-h-0 w-full overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 shadow-inner"
    :class="isCompact ? 'px-2 py-2' : 'p-2 md:p-3'"
  >
    <template v-if="isCompact">
      <div
        class="flex h-full min-h-0 w-full items-stretch gap-2 overflow-hidden"
      >
        <section
          class="flex h-full w-44 shrink-0 items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-2"
        >
          <Icon name="kind-icon:moon" class="h-7 w-7 shrink-0 text-primary" />
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-bold">
              {{ dreamStore.selectedDream?.title || 'Dreams' }}
            </div>
            <div class="truncate text-xs text-base-content/50">
              {{ dreamStore.dreams.length }} loaded
            </div>
          </div>
        </section>

        <section
          class="flex h-full min-w-0 flex-1 items-stretch gap-2 overflow-hidden rounded-2xl border border-base-300 bg-base-100 px-2 py-2"
        >
          <select
            v-model.number="selectedDreamId"
            class="select select-bordered select-sm h-full min-h-0 w-48 shrink-0 rounded-2xl"
            @change="selectDream"
          >
            <option :value="0">Choose dream</option>
            <option
              v-for="dream in dreamStore.dreams"
              :key="dream.id"
              :value="dream.id"
            >
              {{ dream.title || `Dream ${dream.id}` }}
            </option>
          </select>

          <textarea
            ref="dreamMeasureRef"
            v-model="quickMessage"
            class="textarea textarea-bordered h-full min-h-0 min-w-0 flex-1 resize-none overflow-y-auto bg-base-100 px-3 py-2 text-sm leading-snug"
            placeholder="Nudge the dream..."
            :disabled="!dreamStore.selectedDream"
            @input="queuePromptOffsetRefresh"
          />

          <button
            type="button"
            class="btn btn-sm btn-primary h-full shrink-0 text-white"
            :disabled="
              dreamStore.isSaving ||
              !dreamStore.selectedDream ||
              !quickMessage.trim()
            "
            @click="sendQuickMessage"
          >
            Send
          </button>

          <button
            type="button"
            class="btn btn-sm btn-secondary h-full shrink-0"
            @click="newRandomDream"
          >
            New
          </button>
        </section>
      </div>
    </template>

    <template v-else-if="isOpen">
      <div
        class="grid h-full min-h-0 w-full grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[16rem_minmax(0,1fr)]"
      >
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
          >
            <span class="text-sm font-semibold">Dreams</span>
            <span class="badge badge-outline text-xs">
              {{ dreamStore.dreams.length }}
            </span>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-2">
            <button
              v-for="dream in dreamStore.dreams"
              :key="`open-${dream.id}`"
              type="button"
              class="mb-1.5 flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition"
              :class="
                dreamStore.selectedDream?.id === dream.id
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent hover:bg-base-200'
              "
              @click="selectDreamById(dream.id)"
            >
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-200"
              >
                <img
                  v-if="dream.Art?.imagePath"
                  :src="dream.Art.imagePath"
                  :alt="dream.title || 'Dream'"
                  class="h-full w-full object-cover"
                />
                <Icon
                  v-else
                  name="kind-icon:moon"
                  class="h-6 w-6 text-primary"
                />
              </div>

              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold">
                  {{ dream.title || `Dream ${dream.id}` }}
                </div>
                <div class="truncate text-xs text-base-content/55">
                  {{ dream.currentVibe || 'No vibe yet.' }}
                </div>
              </div>
            </button>
          </div>
        </section>

        <section
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden"
        >
          <div
            class="flex shrink-0 items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-3 py-2.5"
          >
            <template v-if="dreamStore.selectedDream">
              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-200"
              >
                <img
                  v-if="dreamStore.selectedDream.Art?.imagePath"
                  :src="dreamStore.selectedDream.Art.imagePath"
                  :alt="dreamStore.selectedDream.title || 'Dream'"
                  class="h-full w-full object-cover"
                />
                <Icon
                  v-else
                  name="kind-icon:moon"
                  class="h-8 w-8 text-primary"
                />
              </div>

              <div class="min-w-0 flex-1">
                <div class="truncate text-base font-bold">
                  {{ dreamStore.selectedDream.title || 'Untitled Dream' }}
                </div>
                <div class="line-clamp-2 text-xs text-base-content/65">
                  {{
                    dreamStore.selectedDream.currentVibe || 'Ready to drift.'
                  }}
                </div>
              </div>

              <button
                type="button"
                class="btn btn-xs btn-ghost shrink-0"
                @click="clearDream"
              >
                Clear
              </button>
            </template>

            <p v-else class="text-sm text-base-content/40">
              Select a dream or create a new one.
            </p>
          </div>

          <div
            class="grid min-h-0 grid-cols-1 gap-3 overflow-hidden md:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]"
          >
            <section
              class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
            >
              <div
                class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
              >
                <span class="text-sm font-semibold">Dream Nudge</span>

                <div class="flex gap-1.5">
                  <button
                    type="button"
                    class="btn btn-xs btn-ghost"
                    @click="fillRandomMessage"
                  >
                    Random
                  </button>

                  <button
                    type="button"
                    class="btn btn-xs btn-ghost"
                    @click="clearMessage"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    class="btn btn-xs btn-primary text-white"
                    :disabled="
                      dreamStore.isSaving ||
                      !dreamStore.selectedDream ||
                      !quickMessage.trim()
                    "
                    @click="sendQuickMessage"
                  >
                    Send
                  </button>
                </div>
              </div>

              <textarea
                ref="dreamMeasureRef"
                v-model="quickMessage"
                class="textarea min-h-0 flex-1 resize-none overflow-y-auto bg-base-100 px-3 py-2.5 text-sm leading-relaxed"
                placeholder="Add a fox, change the room, follow the image..."
                :disabled="!dreamStore.selectedDream"
                @input="queuePromptOffsetRefresh"
              />
            </section>

            <section
              class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
            >
              <div
                class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
              >
                <span class="text-sm font-semibold">New Dream</span>

                <button
                  type="button"
                  class="btn btn-xs btn-secondary"
                  @click="newRandomDream"
                >
                  Seed
                </button>
              </div>

              <div
                class="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto p-3"
              >
                <input
                  v-model="dreamStore.dreamForm.title"
                  class="input input-bordered input-sm rounded-2xl"
                  placeholder="Dream title"
                />

                <textarea
                  v-model="dreamStore.dreamForm.currentVibe"
                  class="textarea textarea-bordered min-h-20 resize-none rounded-2xl text-sm"
                  placeholder="Current vibe"
                />

                <label
                  class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
                >
                  <span class="label-text font-semibold"
                    >Create collection</span
                  >
                  <input
                    v-model="dreamStore.dreamForm.createCollection"
                    type="checkbox"
                    class="toggle toggle-primary"
                  />
                </label>

                <button
                  type="button"
                  class="btn btn-sm btn-primary text-white"
                  :disabled="
                    dreamStore.isSaving ||
                    !dreamStore.dreamForm.currentVibe?.trim()
                  "
                  @click="dreamStore.saveDream"
                >
                  {{ dreamStore.isSaving ? 'Saving...' : 'Save Dream' }}
                </button>
              </div>
            </section>
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <div
        class="grid h-full min-h-0 w-full grid-cols-[minmax(15rem,21rem)_minmax(0,1fr)_minmax(16rem,22rem)] gap-3 overflow-hidden"
      >
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-4 py-3"
          >
            <div>
              <div class="text-sm font-bold">Dreams</div>
              <div class="text-xs text-base-content/50">
                {{ dreamStore.dreams.length }} available
              </div>
            </div>

            <button
              type="button"
              class="btn btn-xs btn-primary text-white"
              @click="newRandomDream"
            >
              New
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-2">
            <button
              v-for="dream in dreamStore.dreams"
              :key="`priority-${dream.id}`"
              type="button"
              class="mb-2 flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition"
              :class="
                dreamStore.selectedDream?.id === dream.id
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 bg-base-200/60 hover:bg-base-200'
              "
              @click="selectDreamById(dream.id)"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-100"
              >
                <img
                  v-if="dream.Art?.imagePath"
                  :src="dream.Art.imagePath"
                  :alt="dream.title || 'Dream'"
                  class="h-full w-full object-cover"
                />
                <Icon
                  v-else
                  name="kind-icon:moon"
                  class="h-7 w-7 text-primary"
                />
              </div>

              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-bold">
                  {{ dream.title || `Dream ${dream.id}` }}
                </div>
                <div class="line-clamp-2 text-xs text-base-content/55">
                  {{ dream.currentVibe || 'No vibe yet.' }}
                </div>
              </div>
            </button>
          </div>
        </section>

        <section
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="border-b border-base-300 px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-lg font-bold">
                  {{ dreamStore.selectedDream?.title || 'Dream Cockpit' }}
                </div>
                <div class="line-clamp-2 text-sm text-base-content/60">
                  {{
                    dreamStore.selectedDream?.currentVibe ||
                    'Choose or seed a dream to begin.'
                  }}
                </div>
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  class="btn btn-xs btn-ghost"
                  @click="fillRandomMessage"
                >
                  Random Nudge
                </button>

                <button
                  type="button"
                  class="btn btn-xs btn-error text-white"
                  :disabled="!dreamStore.selectedDream?.id"
                  @click="deleteSelectedDream"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div
            class="grid min-h-0 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]"
          >
            <section
              class="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-200"
            >
              <div class="min-h-0 overflow-y-auto p-3">
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
                      class="line-clamp-4 text-sm leading-relaxed text-base-content/75"
                    >
                      {{ chat.content }}
                    </p>
                  </article>
                </div>

                <p v-else class="text-sm text-base-content/45">
                  No messages yet. The dream is awkwardly standing near the
                  punch bowl.
                </p>
              </div>

              <div class="border-t border-base-300 bg-base-100 p-2">
                <div class="flex gap-2">
                  <textarea
                    ref="dreamMeasureRef"
                    v-model="quickMessage"
                    class="textarea textarea-bordered min-h-12 flex-1 resize-none rounded-2xl text-sm"
                    placeholder="Steer the dream..."
                    :disabled="!dreamStore.selectedDream"
                    @input="queuePromptOffsetRefresh"
                  />

                  <button
                    type="button"
                    class="btn btn-primary min-h-12 shrink-0 text-white"
                    :disabled="
                      dreamStore.isSaving ||
                      !dreamStore.selectedDream ||
                      !quickMessage.trim()
                    "
                    @click="sendQuickMessage"
                  >
                    Send
                  </button>
                </div>
              </div>
            </section>

            <section class="flex min-h-0 flex-col gap-3 overflow-hidden">
              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <div
                  class="mb-2 text-xs font-bold uppercase tracking-wide text-base-content/50"
                >
                  Current Prompt
                </div>

                <textarea
                  v-model="dreamStore.dreamForm.currentPrompt"
                  class="textarea textarea-bordered min-h-24 w-full resize-none rounded-2xl text-sm"
                  placeholder="Prompt for the next model action"
                />

                <button
                  type="button"
                  class="btn btn-sm btn-secondary mt-2 w-full"
                  :disabled="!dreamStore.selectedDream?.id"
                  @click="saveCurrentPrompt"
                >
                  Save Prompt
                </button>
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <div
                  class="mb-2 text-xs font-bold uppercase tracking-wide text-base-content/50"
                >
                  Current Vibe
                </div>

                <textarea
                  v-model="dreamStore.dreamForm.currentVibe"
                  class="textarea textarea-bordered min-h-28 w-full resize-none rounded-2xl text-sm"
                  placeholder="The current shared dream state"
                />

                <button
                  type="button"
                  class="btn btn-sm btn-primary mt-2 w-full text-white"
                  :disabled="
                    dreamStore.isSaving ||
                    !dreamStore.dreamForm.currentVibe?.trim()
                  "
                  @click="saveDreamForm"
                >
                  {{ dreamStore.isSaving ? 'Saving...' : 'Save Dream' }}
                </button>
              </div>
            </section>
          </div>

          <div
            class="flex shrink-0 items-center justify-between gap-3 border-t border-base-300 bg-base-200/60 px-4 py-3"
          >
            <p class="min-w-0 truncate text-sm text-base-content/60">
              {{ dreamStatus }}
            </p>

            <button
              type="button"
              class="btn btn-sm btn-ghost"
              @click="goToDreams"
            >
              Open Manager
            </button>
          </div>
        </section>

        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="border-b border-base-300 px-4 py-3">
            <div class="text-sm font-bold">Seed a Dream</div>
            <div class="text-xs text-base-content/50">
              Randomizer plus quick creation
            </div>
          </div>

          <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="mb-2 text-xs font-bold uppercase tracking-wide text-base-content/50"
              >
                Random Seed
              </div>

              <p class="text-sm leading-relaxed text-base-content/70">
                {{ previewSeed }}
              </p>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-ghost"
                  @click="refreshSeed"
                >
                  Reroll
                </button>

                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  @click="applySeed"
                >
                  Use Seed
                </button>
              </div>
            </div>

            <label class="form-control">
              <span class="label-text font-semibold">Title</span>
              <input
                v-model="dreamStore.dreamForm.title"
                class="input input-bordered rounded-2xl"
                placeholder="Dream title"
              />
            </label>

            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <span class="label-text font-semibold">Public</span>
              <input
                v-model="dreamStore.dreamForm.isPublic"
                type="checkbox"
                class="toggle toggle-success"
              />
            </label>

            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <span class="label-text font-semibold">Create Collection</span>
              <input
                v-model="dreamStore.dreamForm.createCollection"
                type="checkbox"
                class="toggle toggle-primary"
              />
            </label>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/dream-footer.vue
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import { useDreamStore } from '@/stores/dreamStore'

const router = useRouter()
const displayStore = useDisplayStore()
const dreamStore = useDreamStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

const selectedDreamId = ref(0)
const quickMessage = ref('')
const previewSeed = ref('')

const dreamMeasureRef = ref<HTMLTextAreaElement | null>(null)
let dreamResizeObserver: ResizeObserver | null = null

const dreamStatus = computed(() => {
  if (dreamStore.loading) return 'Loading dreams...'
  if (dreamStore.chatsLoading) return 'Loading dream history...'
  if (dreamStore.isSaving) return 'Saving dream...'
  if (dreamStore.isDeleting) return 'Deleting dream...'
  if (dreamStore.selectedDream?.id) {
    return `Selected dream #${dreamStore.selectedDream.id}`
  }
  return 'Select, seed, or create a dream.'
})

async function selectDream() {
  if (!selectedDreamId.value) {
    clearDream()
    return
  }

  await selectDreamById(selectedDreamId.value)
}

async function selectDreamById(id: number) {
  selectedDreamId.value = id
  await dreamStore.selectDreamById(id)
  await dreamStore.fetchDreamChats(id)
  queuePromptOffsetRefresh()
}

function clearDream() {
  selectedDreamId.value = 0
  dreamStore.deselectDream()
  quickMessage.value = ''
  queuePromptOffsetRefresh()
}

function refreshSeed() {
  previewSeed.value = dreamStore.randomDream()
}

function applySeed() {
  dreamStore.setDreamForm({
    currentVibe: previewSeed.value,
    currentPrompt: previewSeed.value,
  })
}

function newRandomDream() {
  const seed = dreamStore.randomDream()
  previewSeed.value = seed
  dreamStore.createNewDream({
    title: '',
    currentVibe: seed,
    currentPrompt: seed,
    createCollection: true,
    isPublic: true,
    isMature: false,
  })
  selectedDreamId.value = 0
  quickMessage.value = ''
  queuePromptOffsetRefresh()
}

function fillRandomMessage() {
  quickMessage.value = dreamStore.randomDream()
  queuePromptOffsetRefresh()
}

function clearMessage() {
  quickMessage.value = ''
  queuePromptOffsetRefresh()
}

async function sendQuickMessage() {
  if (!dreamStore.selectedDream?.id || !quickMessage.value.trim()) return

  const message = quickMessage.value.trim()
  const result = await dreamStore.addUserDreamMessage(message)

  if (result.success) {
    quickMessage.value = ''
    await dreamStore.fetchDreamChats(dreamStore.selectedDream.id)
  }

  queuePromptOffsetRefresh()
}

async function saveDreamForm() {
  const result = await dreamStore.saveDream()

  if (result.success && result.data?.id) {
    selectedDreamId.value = result.data.id
    await dreamStore.fetchDreamChats(result.data.id)
  }

  queuePromptOffsetRefresh()
}

async function saveCurrentPrompt() {
  if (!dreamStore.selectedDream?.id) return

  await dreamStore.setCurrentPrompt(dreamStore.dreamForm.currentPrompt || '')
  queuePromptOffsetRefresh()
}

async function deleteSelectedDream() {
  if (!dreamStore.selectedDream?.id) return

  const id = dreamStore.selectedDream.id
  const result = await dreamStore.deleteDream(id)

  if (result.success) {
    selectedDreamId.value = 0
    quickMessage.value = ''
  }

  queuePromptOffsetRefresh()
}

async function goToDreams() {
  await router.push('/dreams')
}

function refreshPromptOffset() {
  if (displayStore.footerComponent !== 'dream') {
    displayStore.clearPromptOffset('dream')
    return
  }

  if (footerState.value === 'hidden') {
    displayStore.clearPromptOffset('dream')
    return
  }

  if (footerState.value === 'priority') {
    displayStore.clearPromptOffset('dream')
    return
  }

  const el = dreamMeasureRef.value
  if (!el) {
    displayStore.clearPromptOffset('dream')
    return
  }

  displayStore.refreshPromptOffset(
    'dream',
    el.scrollHeight,
    el.clientHeight,
    footerState.value === 'compact' ? 1.5 : 2.5,
  )
}

function queuePromptOffsetRefresh() {
  nextTick(() => {
    refreshPromptOffset()
  })
}

watch(
  () => [
    footerState.value,
    displayStore.footerComponent,
    dreamStore.selectedDream?.id ?? 0,
    quickMessage.value,
    dreamStore.dreamForm.currentVibe,
    dreamStore.dreamForm.currentPrompt,
  ],
  () => {
    queuePromptOffsetRefresh()
  },
)

onMounted(async () => {
  await dreamStore.initialize()

  if (!previewSeed.value) {
    refreshSeed()
  }

  if (dreamStore.selectedDream?.id) {
    selectedDreamId.value = dreamStore.selectedDream.id
    await dreamStore.fetchDreamChats(dreamStore.selectedDream.id)
  }

  queuePromptOffsetRefresh()

  dreamResizeObserver = new ResizeObserver(() => {
    refreshPromptOffset()
  })

  if (dreamMeasureRef.value) {
    dreamResizeObserver.observe(dreamMeasureRef.value)
  }
})

onBeforeUnmount(() => {
  dreamResizeObserver?.disconnect()
  dreamResizeObserver = null
  displayStore.clearPromptOffset('dream')
})
</script>
