<template>
  <section
    class="narrator-chat-shell pointer-events-auto relative h-full min-h-0 w-full overflow-hidden rounded-4xl"
    :class="hasChatFrame ? 'p-2 sm:p-3' : 'p-0'"
    :style="narratorFrameStyle"
  >
    <div
      v-if="hasChatFrame"
      class="narrator-chat-frame absolute inset-0 z-0"
      aria-hidden="true"
    />

    <div
      v-if="hasChatFrame"
      class="narrator-chat-frame-vignette absolute inset-1 z-0 rounded-4xl"
      aria-hidden="true"
    />

    <section
      class="narrator-chat relative z-10 flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl border border-primary/25 bg-base-100/95 shadow-2xl backdrop-blur-xl"
      :class="{ 'border-primary/35': hasChatFrame }"
    >
      <header
        class="relative flex shrink-0 items-center gap-2 border-b border-base-300/70 bg-base-200/80 px-3 py-2"
      >
        <div
          class="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-primary/30 bg-base-300 shadow"
        >
          <img
            :src="narratorImage"
            :alt="narratorName"
            class="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-black leading-tight text-base-content">
            {{ narratorName }}
          </p>

          <p
            class="truncate text-[0.65rem] font-bold uppercase tracking-wide text-primary/70"
          >
            {{ currentEmotionLabel }}
          </p>
        </div>

        <span
          v-if="currentEmotionRow?.emoticon"
          class="text-lg leading-none"
          aria-hidden="true"
        >
          {{ currentEmotionRow.emoticon }}
        </span>

        <button
          type="button"
          class="btn btn-ghost btn-xs btn-circle"
          aria-label="Close narrator musings"
          @click="emit('close')"
        >
          <Icon name="kind-icon:close" class="h-3.5 w-3.5" />
        </button>
      </header>

      <div
        ref="logRef"
        class="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-base-200/40 px-3 py-3"
      >
        <div class="grid gap-3">
          <article
            v-for="musing in visibleMusings"
            :key="musing.id"
            class="flex items-start gap-2"
          >
            <img
              :src="narratorImage"
              :alt="narratorName"
              class="h-8 w-8 shrink-0 rounded-full border border-base-300 bg-base-300 object-cover shadow-sm"
              loading="lazy"
            />

            <div
              class="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-base-100 px-3 py-2 text-sm leading-relaxed text-base-content/85 shadow-sm"
            >
              <div class="flex items-center gap-2">
                <span
                  v-if="musing.emoticon"
                  class="text-base leading-none"
                  aria-hidden="true"
                >
                  {{ musing.emoticon }}
                </span>

                <p
                  class="truncate text-[0.65rem] font-black uppercase tracking-wide text-primary/70"
                >
                  {{ musing.label }}
                </p>
              </div>

              <p class="mt-1 whitespace-pre-wrap">
                {{ musing.message }}
              </p>
            </div>
          </article>
        </div>
      </div>

      <footer
        class="shrink-0 border-t border-base-300/70 bg-base-100 px-3 py-2"
      >
        <div class="flex items-center justify-between gap-2">
          <p
            class="truncate text-[0.65rem] font-black uppercase tracking-wide text-base-content/50"
          >
            Passive narrator musings
          </p>

          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-xl"
            :class="bubblesEnabled ? 'text-success' : 'text-base-content/40'"
            @click="toggleBubbles"
          >
            <Icon
              :name="bubblesEnabled ? 'kind-icon:message' : 'kind-icon:mute'"
              class="h-3.5 w-3.5"
            />
            {{ bubblesEnabled ? 'On' : 'Muted' }}
          </button>
        </div>
      </footer>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useNarratorStore } from '@/stores/narratorStore'

type MusingEntry = {
  id: string
  label: string
  message: string
  emoticon: string | null
}

const props = withDefaults(
  defineProps<{
    compact?: boolean
    frameImage?: string | null
  }>(),
  {
    compact: false,
    frameImage: null,
  },
)

const emit = defineEmits<{
  close: []
}>()

const narratorStore = useNarratorStore()

const {
  narratorName,
  narratorImage,
  narratorChatFrameImage,
  currentEmotionRow,
  currentEmotionLabel,
  narratorIntro,
  activeBubble,
  bubblesEnabled,
} = storeToRefs(narratorStore)

const { initialize, clearBubble, toggleBubbles } = narratorStore

const logRef = ref<HTMLElement | null>(null)
const musingHistory = ref<MusingEntry[]>([])

const safeFrameImage = computed(() => {
  return normalizeFramePath(props.frameImage ?? narratorChatFrameImage.value)
})

const hasChatFrame = computed(() => Boolean(safeFrameImage.value))

const narratorFrameStyle = computed<Record<string, string>>(() => {
  const frameImage = safeFrameImage.value

  if (!frameImage) return {}

  return {
    '--narrator-chat-frame': `url("${frameImage}")`,
  }
})

const visibleMusings = computed(() => {
  if (musingHistory.value.length) return musingHistory.value

  return [
    {
      id: 'intro',
      label: 'Narrator',
      message: narratorIntro.value,
      emoticon: currentEmotionRow.value?.emoticon ?? null,
    },
  ]
})

function normalizeFramePath(input: string | null | undefined): string | null {
  if (!input) return null

  const trimmed = input.trim()

  if (!trimmed) return null

  const isLocalAsset = trimmed.startsWith('/')
  const isHttpsAsset = trimmed.startsWith('https://')

  if (!isLocalAsset && !isHttpsAsset) return null

  return trimmed.replaceAll('"', '\\"')
}

function addMusing(message: string | null | undefined, label = currentEmotionLabel.value): void {
  const trimmed = message?.trim()
  if (!trimmed) return

  const last = musingHistory.value.at(-1)
  if (last?.message === trimmed && last?.label === label) return

  musingHistory.value.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label,
    message: trimmed,
    emoticon: currentEmotionRow.value?.emoticon ?? null,
  })

  if (musingHistory.value.length > 24) {
    musingHistory.value = musingHistory.value.slice(-24)
  }
}

function scrollToBottom(): void {
  const el = logRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

watch(
  activeBubble,
  async (message) => {
    if (!bubblesEnabled.value) return

    addMusing(message, currentEmotionLabel.value)
    clearBubble()

    await nextTick()
    scrollToBottom()
  },
)

watch(
  currentEmotionLabel,
  async (label, previousLabel) => {
    if (!label || label === previousLabel) return

    const rowMessage =
      currentEmotionRow.value?.message ||
      `Mood shifted to ${label.toLowerCase()}.`

    addMusing(rowMessage, label)

    await nextTick()
    scrollToBottom()
  },
)

watch(
  () => visibleMusings.value.length,
  async () => {
    await nextTick()
    scrollToBottom()
  },
)

onMounted(async () => {
  await initialize()
  addMusing(narratorIntro.value, 'Narrator')
  await nextTick()
  scrollToBottom()
})
</script>

<style scoped>
.narrator-chat-frame {
  background-image: var(--narrator-chat-frame);
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  filter: drop-shadow(0 1rem 1.5rem rgb(0 0 0 / 0.28));
  pointer-events: none;
}

.narrator-chat-frame-vignette {
  background:
    radial-gradient(circle at center, transparent 54%, rgb(0 0 0 / 0.16) 100%),
    radial-gradient(
      circle at top left,
      rgb(255 255 255 / 0.14),
      transparent 38%
    );
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .narrator-chat-frame {
    filter: none;
  }
}
</style>