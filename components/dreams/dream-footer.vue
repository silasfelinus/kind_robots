<!-- /components/navigation/dream-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full min-h-0 w-full overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 shadow-inner"
    :class="isCompact ? 'px-2 py-2' : 'p-2 md:p-3'"
  >
    <template v-if="isCompact">
      <div
        class="grid h-full min-h-0 w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-stretch gap-2 overflow-hidden"
      >
        <section
          class="flex h-full min-w-0 items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-2"
        >
          <Icon name="kind-icon:moon" class="h-7 w-7 shrink-0 text-primary" />

          <div class="hidden min-w-0 sm:block">
            <div class="truncate text-sm font-bold">
              {{ selectedDreamTitle }}
            </div>

            <div class="truncate text-xs text-base-content/50">
              {{ dreamStore.dreams.length }} loaded
            </div>
          </div>
        </section>

        <textarea
          ref="dreamMeasureRef"
          v-model="quickMessage"
          class="textarea textarea-bordered h-full min-h-0 min-w-0 resize-none overflow-y-auto rounded-2xl bg-base-100 px-3 py-2 text-sm leading-snug"
          placeholder="Nudge the dream..."
          :disabled="!dreamStore.selectedDream"
          @input="queuePromptOffsetRefresh"
          @keydown.enter.exact.prevent="sendQuickMessage"
        />

        <button
          type="button"
          class="btn btn-sm btn-primary h-full shrink-0 rounded-2xl text-white"
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
          class="btn btn-sm btn-secondary h-full shrink-0 rounded-2xl"
          @click="openDreams"
        >
          Open
        </button>
      </div>
    </template>

    <template v-else-if="isOpen">
      <div
        class="grid h-full min-h-0 w-full grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]"
      >
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="mb-3 flex shrink-0 items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-bold text-base-content">Dream</h2>

              <p class="text-xs text-base-content/50">
                Select the shared room.
              </p>
            </div>

            <button
              type="button"
              class="btn btn-xs btn-primary rounded-xl text-white"
              @click="openDreams"
            >
              Open
            </button>
          </div>

          <dream-gallery
            variant="dropdown"
            title="Dream"
            subtitle="Choose a dream."
            :show-images="false"
            :show-controls="false"
            :show-toolbar="false"
            :show-card-actions="false"
            :show-open-button="false"
            :auto-load="false"
          />

          <div class="mt-3 rounded-2xl border border-base-300 bg-base-200 p-3">
            <p class="text-xs font-bold uppercase text-base-content/50">
              Selected
            </p>

            <p class="mt-1 truncate text-sm font-bold text-primary">
              {{ selectedDreamTitle }}
            </p>

            <p class="mt-1 line-clamp-3 text-xs text-base-content/60">
              {{ selectedDreamVibe }}
            </p>
          </div>

          <button
            type="button"
            class="btn btn-sm btn-secondary mt-3 rounded-2xl"
            @click="newRandomDream"
          >
            <Icon name="kind-icon:dice" class="h-4 w-4" />
            Seed New Dream
          </button>
        </section>

        <section
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden"
        >
          <div
            class="grid shrink-0 grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 lg:grid-cols-[minmax(0,1fr)_auto]"
          >
            <textarea
              ref="dreamMeasureRef"
              v-model="quickMessage"
              class="textarea textarea-bordered min-h-24 resize-none rounded-2xl bg-base-200 text-sm leading-relaxed"
              placeholder="Add a fox, change the lighting, follow the last image, make it stranger..."
              :disabled="!dreamStore.selectedDream"
              @input="queuePromptOffsetRefresh"
              @keydown.enter.exact.prevent="sendQuickMessage"
            />

            <div class="grid grid-cols-3 gap-2 lg:w-40 lg:grid-cols-1">
              <button
                type="button"
                class="btn btn-sm btn-ghost rounded-2xl"
                @click="fillRandomMessage"
              >
                Random
              </button>

              <button
                type="button"
                class="btn btn-sm btn-ghost rounded-2xl"
                @click="clearMessage"
              >
                Clear
              </button>

              <button
                type="button"
                class="btn btn-sm btn-primary rounded-2xl text-white"
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

          <div
            class="min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <dream-list
              title="Recent Dream History"
              subtitle="Latest nudges, model replies, and image events."
              :show-header="true"
              :compact="true"
              :limit="8"
              :auto-load="false"
            />
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <div
        class="grid h-full min-h-0 w-full grid-cols-[minmax(16rem,24rem)_minmax(0,1fr)_minmax(18rem,26rem)] gap-3 overflow-hidden"
      >
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="mb-3 flex shrink-0 items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-bold text-base-content">Dreams</h2>

              <p class="text-xs text-base-content/50">Pick the active room.</p>
            </div>

            <button
              type="button"
              class="btn btn-xs btn-secondary rounded-xl"
              @click="newRandomDream"
            >
              New
            </button>
          </div>

          <dream-gallery
            variant="row"
            title="Dreams"
            subtitle="Choose a shared dream."
            :show-images="true"
            :show-controls="false"
            :show-toolbar="false"
            :show-card-actions="true"
            :show-open-button="false"
            :show-stats="false"
            :compact="true"
            :auto-load="false"
          />
        </section>

        <section
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="border-b border-base-300 px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-lg font-bold">
                  {{ selectedDreamTitle }}
                </div>

                <div class="line-clamp-2 text-sm text-base-content/60">
                  {{ selectedDreamVibe }}
                </div>
              </div>

              <button
                type="button"
                class="btn btn-xs btn-primary shrink-0 rounded-xl text-white"
                @click="openDreams"
              >
                Open Manager
              </button>
            </div>
          </div>

          <div class="min-h-0 overflow-y-auto bg-base-200 p-3">
            <dream-list
              title="Dream History"
              :show-header="false"
              :compact="true"
              :limit="12"
              :auto-load="false"
            />
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
                @keydown.enter.exact.prevent="sendQuickMessage"
              />

              <button
                type="button"
                class="btn btn-primary min-h-12 shrink-0 rounded-2xl text-white"
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

        <section
          class="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div>
            <h2 class="text-sm font-bold text-base-content">Quick Seed</h2>

            <p class="text-xs text-base-content/50">
              Start a fresh collaborative dream.
            </p>
          </div>

          <div
            class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <p class="text-sm leading-relaxed text-base-content/70">
              {{ previewSeed }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="btn btn-sm btn-ghost rounded-2xl"
              @click="refreshSeed"
            >
              Reroll
            </button>

            <button
              type="button"
              class="btn btn-sm btn-secondary rounded-2xl"
              @click="applySeed"
            >
              Use Seed
            </button>
          </div>

          <label class="form-control">
            <span class="label-text text-xs font-semibold">Title</span>

            <input
              v-model="dreamStore.dreamForm.title"
              class="input input-bordered input-sm rounded-2xl"
              placeholder="Dream title"
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

          <button
            type="button"
            class="btn btn-sm btn-primary rounded-2xl text-white"
            :disabled="
              dreamStore.isSaving || !dreamStore.dreamForm.currentVibe?.trim()
            "
            @click="saveDreamForm"
          >
            {{ dreamStore.isSaving ? 'Saving...' : 'Save Dream' }}
          </button>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'

const router = useRouter()
const displayStore = useDisplayStore()
const dreamStore = useDreamStore()
const navStore = useNavStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

const quickMessage = ref('')
const previewSeed = ref('')
const dreamMeasureRef = ref<HTMLTextAreaElement | null>(null)

let dreamResizeObserver: ResizeObserver | null = null

const selectedDreamTitle = computed(
  () => dreamStore.selectedDream?.title || 'Dreams',
)

const selectedDreamVibe = computed(
  () =>
    dreamStore.selectedDream?.currentVibe ||
    dreamStore.dreamForm.currentVibe ||
    'Select, seed, or create a dream.',
)

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

  dreamStore.startAddingDream({
    title: '',
    currentVibe: seed,
    currentPrompt: seed,
    createCollection: true,
    isPublic: true,
    isMature: false,
  })

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
    await dreamStore.selectDreamById(result.data.id)
    await dreamStore.fetchDreamChats(result.data.id)
  }

  queuePromptOffsetRefresh()
}

async function openDreams() {
  navStore.setDashboardTab('dream', 'overview')
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
  await Promise.all([dreamStore.initialize(), navStore.initialize()])

  if (!previewSeed.value) {
    refreshSeed()
  }

  if (dreamStore.selectedDream?.id) {
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
