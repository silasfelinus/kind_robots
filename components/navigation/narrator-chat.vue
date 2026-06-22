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
          <p
            class="truncate text-sm font-black leading-tight text-base-content"
          >
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
          v-if="narratorSession.length"
          type="button"
          class="btn btn-ghost btn-xs btn-circle"
          title="Clear conversation"
          aria-label="Clear conversation"
          :disabled="isNarratorResponding"
          @click="clearSession"
        >
          <Icon name="kind-icon:trash" class="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-xs btn-circle"
          aria-label="Close narrator chat"
          @click="emit('close')"
        >
          <Icon name="kind-icon:close" class="h-3.5 w-3.5" />
        </button>
      </header>

      <div
        ref="logRef"
        class="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-base-200/40 px-3 py-3"
      >
        <div
          v-if="!narratorSession.length"
          class="flex h-full flex-col justify-center gap-3"
        >
          <div class="flex items-start gap-3">
            <img
              :src="narratorImage"
              :alt="narratorName"
              class="h-10 w-10 shrink-0 rounded-2xl border border-primary/30 bg-base-300 object-cover shadow"
              loading="lazy"
            />

            <div
              class="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-base-100 px-3 py-2 text-sm leading-relaxed text-base-content/80 shadow-sm"
            >
              {{ narratorIntro }}
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="starter in narratorStarterPrompts"
              :key="starter.key"
              type="button"
              class="btn btn-sm rounded-2xl border-base-300 bg-base-100 font-bold shadow-sm hover:border-primary/40"
              @click="applyStarterPrompt(starter)"
            >
              <Icon :name="starter.icon" class="h-4 w-4 text-primary" />
              {{ starter.title }}
            </button>
          </div>
        </div>

        <div v-else class="grid gap-3">
          <article
            v-for="chat in narratorSession"
            :key="chat.id"
            class="grid gap-2"
          >
            <div
              class="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm leading-relaxed text-primary-content shadow-sm"
            >
              <p class="whitespace-pre-wrap">{{ chat.content }}</p>
            </div>

            <div class="flex max-w-[90%] items-end gap-2">
              <img
                :src="narratorImage"
                :alt="narratorName"
                class="h-7 w-7 shrink-0 rounded-full border border-base-300 bg-base-300 object-cover"
                loading="lazy"
              />

              <div
                class="min-w-0 rounded-2xl rounded-bl-sm bg-base-100 px-3 py-2 text-sm leading-relaxed text-base-content/85 shadow-sm"
              >
                <span
                  v-if="!chat.botResponse"
                  class="flex items-center gap-1 py-1 text-base-content/60"
                  aria-label="Narrator is typing"
                >
                  <span class="narrator-chat-dot" />
                  <span class="narrator-chat-dot delay-150" />
                  <span class="narrator-chat-dot delay-300" />
                </span>

                <p v-else class="whitespace-pre-wrap">
                  {{ chat.botResponse }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>

      <p
        v-if="statusMessage"
        class="shrink-0 border-t px-3 py-1.5 text-xs font-bold"
        :class="
          statusTone === 'error'
            ? 'border-error/30 bg-error/10 text-error'
            : 'border-success/30 bg-success/10 text-success'
        "
      >
        {{ statusMessage }}
      </p>

      <footer
        class="flex shrink-0 items-end gap-2 border-t border-base-300/70 bg-base-100 px-2.5 py-2"
      >
        <textarea
          v-model="narratorMessage"
          :rows="compact ? 1 : 2"
          class="textarea textarea-bordered min-h-0 flex-1 resize-none rounded-2xl bg-base-100 text-sm leading-relaxed"
          :placeholder="narratorPlaceholder"
          :disabled="!canUseNarrator || isNarratorResponding"
          @keydown.enter.exact.prevent="handleSend"
          @keydown.ctrl.enter.prevent="handleSend"
          @keydown.meta.enter.prevent="handleSend"
        />

        <button
          type="button"
          class="btn btn-primary btn-circle btn-sm shrink-0 text-white shadow-md"
          :disabled="!canSendNarrator"
          aria-label="Send"
          @click="handleSend"
        >
          <span
            v-if="isNarratorResponding"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:send" class="h-4 w-4" />
        </button>
      </footer>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useNarratorStore } from '@/stores/narratorStore'

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
  narratorStarterPrompts,
  narratorSession,
  narratorMessage,
  statusMessage,
  statusTone,
  isNarratorResponding,
  canUseNarrator,
  canSendNarrator,
  narratorPlaceholder,
} = storeToRefs(narratorStore)

const { initialize, applyStarterPrompt, sendNarratorMessage, clearSession } =
  narratorStore

const logRef = ref<HTMLElement | null>(null)

const safeFrameImage = computed(() => {
  return normalizeFramePath(props.frameImage ?? narratorChatFrameImage.value)
})

const hasChatFrame = computed(() => Boolean(safeFrameImage.value))

const narratorFrameStyle = computed<Record<string, string>>(
  (): Record<string, string> => {
    const frameImage = safeFrameImage.value

    if (!frameImage) return {}

    return {
      '--narrator-chat-frame': `url("${frameImage}")`,
    }
  },
)

function normalizeFramePath(input: string | null | undefined): string | null {
  if (!input) return null

  const trimmed = input.trim()

  if (!trimmed) return null

  const isLocalAsset = trimmed.startsWith('/')
  const isHttpsAsset = trimmed.startsWith('https://')

  if (!isLocalAsset && !isHttpsAsset) return null

  return trimmed.replaceAll('"', '\\"')
}

function scrollToBottom(): void {
  const el = logRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function handleSend(): void {
  if (!canSendNarrator.value) return
  void sendNarratorMessage()
}

watch(
  () =>
    narratorSession.value
      .map((chat) => `${chat.id}:${chat.botResponse ?? ''}`)
      .join('|'),
  async () => {
    await nextTick()
    scrollToBottom()
  },
)

watch(
  () => narratorSession.value.length,
  async () => {
    await nextTick()
    scrollToBottom()
  },
)

onMounted(async () => {
  await initialize()
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

.narrator-chat-dot {
  display: inline-block;
  height: 0.375rem;
  width: 0.375rem;
  border-radius: 9999px;
  background: currentColor;
  animation: narrator-chat-bounce 1s ease-in-out infinite;
}

.narrator-chat-dot.delay-150 {
  animation-delay: 150ms;
}

.narrator-chat-dot.delay-300 {
  animation-delay: 300ms;
}

@keyframes narrator-chat-bounce {
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

@media (prefers-reduced-motion: reduce) {
  .narrator-chat-dot {
    animation: none;
    opacity: 0.6;
  }
}
</style>
