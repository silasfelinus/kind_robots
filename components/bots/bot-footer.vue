<!-- /components/navigation/bot-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 shadow-inner"
    :class="isCompact ? 'px-2 py-2' : 'p-2 md:p-3'"
  >
    <!-- ═══════════════════════════════════════════════════════════
         COMPACT  — avatar rail · selected slot · composer
         ═══════════════════════════════════════════════════════════ -->
    <template v-if="isCompact">
      <div
        class="flex h-full w-full min-h-0 items-stretch gap-2 overflow-hidden"
      >
        <!-- 1 · Vertical bot picker (avatar + name, scrollable) -->
        <section
          class="flex h-full w-36 shrink-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="shrink-0 border-b border-base-300 px-2 py-1 text-xs font-semibold text-base-content/50 uppercase tracking-wide"
          >
            Bots
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto">
            <button
              v-for="bot in bots"
              :key="`compact-${bot.id}`"
              type="button"
              class="flex w-full items-center gap-2 px-2 py-1.5 text-left transition hover:bg-base-200"
              :class="
                botStore.currentBot?.id === bot.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-base-content'
              "
              @click="selectBot(bot.id)"
            >
              <img
                :src="bot.avatarImage || '/images/bot.webp'"
                :alt="bot.name || 'Bot'"
                class="h-7 w-7 shrink-0 rounded-lg border border-base-300 object-cover"
              />
              <span class="truncate text-xs font-semibold">
                {{ bot.name || 'Unnamed' }}
              </span>
            </button>
          </div>
        </section>

        <!-- 2 · Selected bot slot -->
        <section
          class="flex h-full w-44 shrink-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="shrink-0 border-b border-base-300 px-2 py-1 text-xs font-semibold text-base-content/50 uppercase tracking-wide"
          >
            Selected
          </div>
          <div class="flex min-h-0 flex-1 items-center gap-2 px-2">
            <template v-if="botStore.currentBot">
              <img
                :src="botStore.currentBot.avatarImage || '/images/bot.webp'"
                :alt="botStore.currentBot.name || 'Bot'"
                class="h-10 w-10 shrink-0 rounded-xl border border-base-300 object-cover"
              />
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-bold">
                  {{ botStore.currentBot.name || 'Unnamed' }}
                </div>
                <div class="truncate text-xs text-base-content/55">
                  {{ botStore.currentBot.description || 'Ready.' }}
                </div>
              </div>
              <button
                type="button"
                class="btn btn-xs btn-ghost shrink-0"
                @click="clearSelectedBot"
              >
                ✕
              </button>
            </template>
            <p v-else class="text-xs text-base-content/40 px-1">Pick a bot →</p>
          </div>
        </section>

        <!-- 3 · Composer -->
        <section
          class="flex h-full min-w-0 flex-1 items-stretch gap-2 overflow-hidden rounded-2xl border border-base-300 bg-base-100 px-2 py-2"
        >
          <textarea
            ref="messageMeasureRef"
            v-model="launchMessage"
            class="textarea textarea-bordered h-full min-h-0 w-full resize-none overflow-y-auto bg-base-100 px-3 py-2 text-sm leading-snug"
            placeholder="Give your bot a first line…"
            :disabled="!botStore.currentBot"
          />
          <button
            type="button"
            class="btn btn-sm btn-primary h-full shrink-0 px-4 text-white"
            :disabled="!botStore.currentBot || !launchMessage.trim()"
            @click="launchBot"
          >
            Send
          </button>
        </section>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════════════════════
         OPEN  — bot list · (detail + composer stacked)
         ═══════════════════════════════════════════════════════════ -->
    <template v-else-if="isOpen">
      <div
        class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[14rem_minmax(0,1fr)]"
      >
        <!-- Col 1 · Bot list -->
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
          >
            <span class="text-sm font-semibold">Bots</span>
            <span class="badge badge-outline text-xs">{{ bots.length }}</span>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto p-2">
            <button
              v-for="bot in bots"
              :key="`open-${bot.id}`"
              type="button"
              class="flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition mb-1.5"
              :class="
                botStore.currentBot?.id === bot.id
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent hover:bg-base-200'
              "
              @click="selectBot(bot.id)"
            >
              <img
                :src="bot.avatarImage || '/images/bot.webp'"
                :alt="bot.name || 'Bot'"
                class="h-9 w-9 shrink-0 rounded-xl border border-base-300 object-cover"
              />
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold">
                  {{ bot.name || 'Unnamed Bot' }}
                </div>
                <div class="truncate text-xs text-base-content/55">
                  {{ bot.description || '—' }}
                </div>
              </div>
            </button>
          </div>
        </section>

        <!-- Col 2 · Detail + Composer stacked -->
        <section
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden"
        >
          <!-- Selected bot detail -->
          <div
            class="flex shrink-0 items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-3 py-2.5"
          >
            <template v-if="botStore.currentBot">
              <img
                :src="botStore.currentBot.avatarImage || '/images/bot.webp'"
                :alt="botStore.currentBot.name || 'Bot'"
                class="h-14 w-14 shrink-0 rounded-2xl border border-base-300 object-cover"
              />
              <div class="min-w-0 flex-1">
                <div class="truncate text-base font-bold">
                  {{ botStore.currentBot.name || 'Unnamed Bot' }}
                </div>
                <div class="line-clamp-2 text-xs text-base-content/65">
                  {{ botStore.currentBot.description || 'A bot of mystery.' }}
                </div>
              </div>
              <button
                type="button"
                class="btn btn-xs btn-ghost shrink-0"
                @click="clearSelectedBot"
              >
                Clear
              </button>
            </template>
            <p v-else class="text-sm text-base-content/40">
              Select a bot from the list.
            </p>
          </div>

          <!-- Composer -->
          <div
            class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
          >
            <div
              class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
            >
              <span class="text-sm font-semibold">Opening Message</span>
              <div class="flex gap-1.5">
                <button
                  type="button"
                  class="btn btn-xs btn-ghost"
                  @click="fillStarter"
                >
                  Starter
                </button>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost"
                  @click="fillWeirdStarter"
                >
                  Weird
                </button>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost"
                  @click="resetFooter"
                >
                  Clear
                </button>
                <button
                  type="button"
                  class="btn btn-xs btn-primary text-white"
                  :disabled="!botStore.currentBot || !launchMessage.trim()"
                  @click="launchBot"
                >
                  Open in Bots
                </button>
              </div>
            </div>
            <textarea
              ref="messageMeasureRef"
              v-model="launchMessage"
              class="textarea min-h-0 flex-1 resize-none overflow-y-auto bg-base-100 px-3 py-2.5 text-sm leading-relaxed"
              placeholder="Type the first message to hand off to /bots…"
              :disabled="!botStore.currentBot"
            />
          </div>
        </section>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════════════════════
         PRIORITY  — bot list · selected detail + prompts · composer
         ═══════════════════════════════════════════════════════════ -->
    <template v-else>
      <div
        class="grid h-full w-full min-h-0 gap-3 overflow-hidden grid-cols-1 2xl:grid-cols-[14rem_minmax(14rem,20rem)_minmax(0,1fr)]"
      >
        <!-- Col 1 · Bot gallery -->
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between border-b border-base-300 px-3 py-2"
          >
            <span class="text-sm font-semibold">Bots</span>
            <div class="badge badge-outline text-xs">{{ bots.length }}</div>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto p-2">
            <button
              v-for="bot in bots"
              :key="`priority-${bot.id}`"
              type="button"
              class="flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition mb-1.5"
              :class="
                botStore.currentBot?.id === bot.id
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent hover:bg-base-200'
              "
              @click="selectBot(bot.id)"
            >
              <img
                :src="bot.avatarImage || '/images/bot.webp'"
                :alt="bot.name || 'Bot'"
                class="h-10 w-10 shrink-0 rounded-xl border border-base-300 object-cover"
              />
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold">
                  {{ bot.name || 'Unnamed Bot' }}
                </div>
                <div class="line-clamp-2 text-xs text-base-content/55">
                  {{ bot.description || '—' }}
                </div>
              </div>
            </button>
          </div>
        </section>

        <!-- Col 2 · Selected bot detail -->
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between border-b border-base-300 px-3 py-2"
          >
            <span class="text-sm font-semibold">Bot Details</span>
            <button
              v-if="botStore.currentBot"
              type="button"
              class="btn btn-xs btn-ghost"
              @click="clearSelectedBot"
            >
              Clear
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto">
            <template v-if="botStore.currentBot">
              <!-- Avatar + name -->
              <div class="flex items-center gap-3 p-3 pb-2">
                <img
                  :src="botStore.currentBot.avatarImage || '/images/bot.webp'"
                  :alt="botStore.currentBot.name || 'Bot'"
                  class="h-16 w-16 shrink-0 rounded-2xl border border-base-300 object-cover"
                />
                <div class="min-w-0 flex-1">
                  <div class="truncate text-base font-bold">
                    {{ botStore.currentBot.name || 'Unnamed Bot' }}
                  </div>
                  <div
                    v-if="botStore.currentBot.subtitle"
                    class="truncate text-xs text-base-content/60 italic"
                  >
                    {{ botStore.currentBot.subtitle }}
                  </div>
                </div>
              </div>

              <!-- Description -->
              <p class="px-3 pb-3 text-xs text-base-content/65 leading-relaxed">
                {{ botStore.currentBot.description || 'A bot of mystery.' }}
              </p>

              <!-- Personality tag if present -->
              <div
                v-if="botStore.currentBot.personality"
                class="mx-3 mb-3 rounded-xl bg-base-200 px-3 py-2 text-xs"
              >
                <span
                  class="font-semibold text-base-content/50 uppercase tracking-wide text-[10px]"
                  >Personality</span
                >
                <p class="mt-0.5 text-base-content/75">
                  {{ botStore.currentBot.personality }}
                </p>
              </div>

              <!-- Prompt helpers -->
              <div class="grid grid-cols-1 gap-2 px-3 pb-3">
                <button
                  type="button"
                  class="btn btn-sm btn-outline"
                  @click="fillStarter"
                >
                  Use starter prompt
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline btn-accent"
                  @click="fillWeirdStarter"
                >
                  Use weird prompt
                </button>
              </div>
            </template>

            <div
              v-else
              class="flex h-full min-h-48 items-center justify-center p-6 text-center text-sm text-base-content/40"
            >
              Select a bot from the gallery.
            </div>
          </div>
        </section>

        <!-- Col 3 · Composer -->
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between border-b border-base-300 px-3 py-2"
          >
            <span class="text-sm font-semibold">Composer</span>
            <div class="flex gap-1.5">
              <button
                type="button"
                class="btn btn-xs btn-ghost"
                @click="resetFooter"
              >
                Clear
              </button>
              <button
                type="button"
                class="btn btn-sm btn-primary text-white"
                :disabled="!botStore.currentBot || !launchMessage.trim()"
                @click="launchBot"
              >
                Open in Bots
              </button>
            </div>
          </div>

          <textarea
            ref="messageMeasureRef"
            v-model="launchMessage"
            class="textarea min-h-0 flex-1 resize-none overflow-y-auto bg-base-100 px-3 py-3 text-sm leading-relaxed"
            placeholder="Type the first message to hand off to /bots…"
            :disabled="!botStore.currentBot"
          />

          <!-- Live preview strip -->
          <div
            v-if="launchMessage.trim()"
            class="shrink-0 border-t border-base-300 bg-base-200 px-3 py-2"
          >
            <div
              class="text-[10px] font-semibold uppercase tracking-wide text-base-content/40 mb-1"
            >
              Preview
            </div>
            <p
              class="line-clamp-2 text-xs text-base-content/70 leading-relaxed"
            >
              {{ launchMessage }}
            </p>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/bot-footer.vue
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBotStore } from '@/stores/botStore'
import { useDisplayStore } from '@/stores/displayStore'

type BotLike = {
  id: number
  name?: string | null
  description?: string | null
  avatarImage?: string | null
}

const router = useRouter()
const botStore = useBotStore()
const displayStore = useDisplayStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

const bots = computed<BotLike[]>(() => botStore.bots as BotLike[])

const launchMessage = computed({
  get: () => botStore.pendingLaunchMessage,
  set: (value: string) => botStore.setPendingLaunchMessage(value),
})

const messageMeasureRef = ref<HTMLTextAreaElement | null>(null)
let messageResizeObserver: ResizeObserver | null = null

async function selectBot(botId: number) {
  await botStore.selectBot(botId)
  queuePromptOffsetRefresh()
}

function clearSelectedBot() {
  botStore.deselectBot()
  displayStore.clearPromptOffset('kind')
}

function fillStarter() {
  if (botStore.currentBot?.name) {
    botStore.setPendingLaunchMessage(
      `Hey ${botStore.currentBot.name}, I want your help with something.`,
    )
    queuePromptOffsetRefresh()
    return
  }
  botStore.setPendingLaunchMessage('Hey bot, I want your help with something.')
  queuePromptOffsetRefresh()
}

function fillWeirdStarter() {
  if (botStore.currentBot?.name) {
    botStore.setPendingLaunchMessage(
      `Hey ${botStore.currentBot.name}, let's make something strange, clever, and unexpectedly excellent.`,
    )
    queuePromptOffsetRefresh()
    return
  }
  botStore.setPendingLaunchMessage(
    "Let's make something strange, clever, and unexpectedly excellent.",
  )
  queuePromptOffsetRefresh()
}

function resetFooter() {
  botStore.clearPendingLaunchMessage()
  queuePromptOffsetRefresh()
}

function refreshPromptOffset() {
  if (displayStore.footerComponent !== 'kind') {
    displayStore.clearPromptOffset('kind')
    return
  }
  if (footerState.value === 'hidden') {
    displayStore.clearPromptOffset('kind')
    return
  }
  if (footerState.value === 'priority') {
    displayStore.clearPromptOffset('kind')
    return
  }
  const el = messageMeasureRef.value
  if (!el || !botStore.currentBot) {
    displayStore.clearPromptOffset('kind')
    return
  }
  displayStore.refreshPromptOffset(
    'kind',
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
    botStore.currentBot?.id ?? 0,
    botStore.pendingLaunchMessage,
  ],
  () => {
    queuePromptOffsetRefresh()
  },
)

async function launchBot() {
  if (!botStore.currentBot || !botStore.pendingLaunchMessage.trim()) return
  await router.push('/bots')
}

onMounted(async () => {
  await botStore.initialize()
  queuePromptOffsetRefresh()

  messageResizeObserver = new ResizeObserver(() => {
    refreshPromptOffset()
  })

  if (messageMeasureRef.value) {
    messageResizeObserver.observe(messageMeasureRef.value)
  }
})

onBeforeUnmount(() => {
  messageResizeObserver?.disconnect()
  messageResizeObserver = null
  displayStore.clearPromptOffset('kind')
})
</script>
