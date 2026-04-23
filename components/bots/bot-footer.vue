<!-- /components/navigation/bot-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 shadow-inner"
    :class="isCompact ? 'px-2 py-2' : 'p-2 md:p-3'"
  >
    <template v-if="isCompact">
      <div
        class="flex h-full w-full min-h-0 items-center gap-2 overflow-hidden"
      >
        <section
          class="flex h-full min-w-0 flex-1 items-center gap-2 overflow-x-auto overflow-y-hidden rounded-2xl border border-base-300 bg-base-100 px-2 py-2"
        >
          <button
            v-for="bot in bots"
            :key="`compact-${bot.id}`"
            type="button"
            class="flex h-full min-w-44 max-w-52nk-0 items-center gap-2 rounded-2xl border px-2 py-2 text-left transition"
            :class="
              botStore.currentBot?.id === bot.id
                ? 'border-primary bg-primary/10'
                : 'border-base-300 bg-base-200 hover:bg-base-300'
            "
            @click="selectBot(bot.id)"
          >
            <img
              :src="bot.avatarImage || '/images/bot.webp'"
              :alt="bot.name || 'Bot avatar'"
              class="h-10 w-10 shrink-0 rounded-2xl border border-base-300 object-cover"
            />

            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-semibold">
                {{ bot.name || 'Unnamed Bot' }}
              </div>
              <div class="truncate text-xs text-base-content/70">
                {{ bot.description || 'Pick this bot to start chatting.' }}
              </div>
            </div>
          </button>
        </section>

        <section
          class="flex h-full w-44 shrink-0 items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-2 py-2"
        >
          <img
            :src="botStore.currentBot?.avatarImage || '/images/bot.webp'"
            :alt="botStore.currentBot?.name || 'Bot avatar'"
            class="h-11 w-11 shrink-0 rounded-2xl border border-base-300 object-cover"
          />

          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-semibold">
              {{ botStore.currentBot?.name || 'Choose Bot' }}
            </div>
            <div class="truncate text-xs text-base-content/70">
              {{
                botStore.currentBot?.description ||
                'Select one from the scroll row.'
              }}
            </div>
          </div>

          <button
            v-if="botStore.currentBot"
            type="button"
            class="btn btn-xs btn-ghost shrink-0"
            @click="clearSelectedBot"
          >
            <icon name="kind-icon:x" class="h-3.5 w-3.5" />
          </button>
        </section>

        <section
          class="flex h-full min-w-0 flex-[1.2] items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-2 py-2"
        >
          <textarea
            ref="messageMeasureRef"
            v-model="launchMessage"
            class="textarea textarea-bordered h-full min-h-0 w-full resize-none overflow-y-auto bg-base-100 px-3 py-2 text-sm leading-snug"
            placeholder="Give your bot a first line..."
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

    <template v-else-if="isOpen">
      <div
        class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]"
      >
        <section class="flex min-h-0 flex-col gap-3 overflow-hidden">
          <div
            class="flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-100 px-3 py-2"
          >
            <div class="min-w-0">
              <div class="truncate text-base font-semibold">🤖 Bot Footer</div>
              <div class="text-xs text-base-content/60">
                Choose a bot, write an opener, punt to /bots
              </div>
            </div>

            <div class="badge badge-outline shrink-0">
              {{ bots.length }} bots
            </div>
          </div>

          <div
            class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
          >
            <div
              class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
            >
              <span class="text-sm font-semibold">Selected Bot</span>

              <button
                v-if="botStore.currentBot"
                type="button"
                class="btn btn-xs btn-ghost"
                @click="clearSelectedBot"
              >
                Clear
              </button>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto p-3">
              <div
                v-if="botStore.currentBot"
                class="flex h-full min-h-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
              >
                <div class="flex items-center gap-3">
                  <img
                    :src="botStore.currentBot.avatarImage || '/images/bot.webp'"
                    :alt="botStore.currentBot.name || 'Bot avatar'"
                    class="h-20 w-20 shrink-0 rounded-2xl border border-base-300 object-cover"
                  />

                  <div class="min-w-0 flex-1">
                    <div class="truncate text-lg font-semibold">
                      {{ botStore.currentBot.name || 'Unnamed Bot' }}
                    </div>
                    <div class="line-clamp-4 text-sm text-base-content/70">
                      {{
                        botStore.currentBot.description ||
                        'A mysterious bot awaits your first message.'
                      }}
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 gap-2">
                  <div class="rounded-2xl bg-base-100 px-3 py-2 text-sm">
                    <div
                      class="text-xs uppercase tracking-wide text-base-content/50"
                    >
                      Ready for
                    </div>
                    <div class="font-semibold">
                      First contact, weird ideas, and tasteful chaos
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="flex h-full min-h-40 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-center text-sm text-base-content/70"
              >
                Pick a bot from the gallery to load its card.
              </div>
            </div>
          </div>
        </section>

        <section
          class="grid min-h-0 grid-cols-1 gap-3 overflow-hidden lg:grid-rows-[auto_minmax(0,1fr)]"
        >
          <div
            class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
          >
            <div
              class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
            >
              <span class="text-sm font-semibold">Bot Gallery</span>
              <span class="text-xs text-base-content/60">scrollable</span>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto p-3">
              <div class="grid min-h-0 grid-cols-1 gap-2 xl:grid-cols-2">
                <button
                  v-for="bot in bots"
                  :key="`open-${bot.id}`"
                  type="button"
                  class="flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition"
                  :class="
                    botStore.currentBot?.id === bot.id
                      ? 'border-primary bg-primary/10'
                      : 'border-base-300 bg-base-200 hover:bg-base-300'
                  "
                  @click="selectBot(bot.id)"
                >
                  <img
                    :src="bot.avatarImage || '/images/bot.webp'"
                    :alt="bot.name || 'Bot avatar'"
                    class="h-14 w-14 shrink-0 rounded-2xl border border-base-300 object-cover"
                  />

                  <div class="min-w-0 flex-1">
                    <div class="truncate font-semibold">
                      {{ bot.name || 'Unnamed Bot' }}
                    </div>
                    <div class="line-clamp-2 text-xs text-base-content/70">
                      {{
                        bot.description || 'Pick this bot to start chatting.'
                      }}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div
            class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
          >
            <div
              class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
            >
              <span class="text-sm font-semibold">Opening Message</span>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn btn-xs btn-secondary"
                  @click="fillStarter"
                >
                  Starter
                </button>
                <button
                  type="button"
                  class="btn btn-xs btn-accent"
                  @click="fillWeirdStarter"
                >
                  Weird
                </button>
                <button
                  type="button"
                  class="btn btn-xs btn-warning"
                  @click="resetFooter"
                >
                  Reset
                </button>
              </div>
            </div>

            <div
              class="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_18rem]"
            >
              <div class="flex min-h-0 flex-col gap-3 overflow-hidden">
                <textarea
                  ref="messageMeasureRef"
                  v-model="launchMessage"
                  class="textarea textarea-bordered min-h-32 flex-1 resize-none overflow-y-auto bg-base-100 text-sm"
                  placeholder="Type the first message to hand off to /bots..."
                  :disabled="!botStore.currentBot"
                />

                <div class="flex shrink-0 justify-end">
                  <button
                    type="button"
                    class="btn btn-primary text-white"
                    :disabled="!botStore.currentBot || !launchMessage.trim()"
                    @click="launchBot"
                  >
                    Open in Bots
                  </button>
                </div>
              </div>

              <div
                class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
              >
                <div
                  class="shrink-0 border-b border-base-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-base-content/60"
                >
                  Preview
                </div>

                <div
                  class="min-h-0 flex-1 overflow-y-auto px-3 py-3 text-sm leading-relaxed"
                >
                  {{ launchMessage || 'No message yet...' }}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <div
        class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden 2xl:grid-cols-[minmax(18rem,24rem)_minmax(18rem,24rem)_minmax(0,1fr)]"
      >
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
          >
            <span class="text-sm font-semibold">Bot Gallery</span>
            <div class="badge badge-outline">{{ bots.length }}</div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-3">
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="bot in bots"
                :key="`priority-${bot.id}`"
                type="button"
                class="flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition"
                :class="
                  botStore.currentBot?.id === bot.id
                    ? 'border-primary bg-primary/10'
                    : 'border-base-300 bg-base-200 hover:bg-base-300'
                "
                @click="selectBot(bot.id)"
              >
                <img
                  :src="bot.avatarImage || '/images/bot.webp'"
                  :alt="bot.name || 'Bot avatar'"
                  class="h-16 w-16 shrink-0 rounded-2xl border border-base-300 object-cover"
                />

                <div class="min-w-0 flex-1">
                  <div class="truncate font-semibold">
                    {{ bot.name || 'Unnamed Bot' }}
                  </div>
                  <div class="line-clamp-3 text-xs text-base-content/70">
                    {{ bot.description || 'Pick this bot to start chatting.' }}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>

        <section class="flex min-h-0 flex-col gap-3 overflow-hidden">
          <div
            class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
          >
            <div
              class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
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

            <div class="min-h-0 flex-1 overflow-y-auto p-3">
              <div
                v-if="botStore.currentBot"
                class="flex min-h-full flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
              >
                <div class="flex items-center gap-3">
                  <img
                    :src="botStore.currentBot.avatarImage || '/images/bot.webp'"
                    :alt="botStore.currentBot.name || 'Bot avatar'"
                    class="h-24 w-24 shrink-0 rounded-2xl border border-base-300 object-cover"
                  />

                  <div class="min-w-0 flex-1">
                    <div class="truncate text-lg font-semibold">
                      {{ botStore.currentBot.name || 'Unnamed Bot' }}
                    </div>
                    <div class="line-clamp-5 text-sm text-base-content/70">
                      {{
                        botStore.currentBot.description ||
                        'A mysterious bot awaits your first message.'
                      }}
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-secondary"
                    @click="fillStarter"
                  >
                    Use Starter Prompt
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-accent"
                    @click="fillWeirdStarter"
                  >
                    Use Weird Prompt
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-warning"
                    @click="resetFooter"
                  >
                    Clear Prompt
                  </button>
                </div>

                <div
                  class="rounded-2xl border border-base-300 bg-base-100 p-3 text-sm text-base-content/70"
                >
                  This mode gets the extra bells and whistles without pretending
                  the footer is infinite. Fancy, but still domesticated.
                </div>
              </div>

              <div
                v-else
                class="flex h-full min-h-48 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-center text-sm text-base-content/70"
              >
                No bot selected yet.
              </div>
            </div>
          </div>
        </section>

        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
          >
            <span class="text-sm font-semibold">Composer</span>

            <button
              type="button"
              class="btn btn-sm btn-primary text-white"
              :disabled="!botStore.currentBot || !launchMessage.trim()"
              @click="launchBot"
            >
              Open in Bots
            </button>
          </div>

          <div
            class="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-rows-[minmax(0,1fr)_10rem]"
          >
            <textarea
              ref="messageMeasureRef"
              v-model="launchMessage"
              class="textarea textarea-bordered min-h-0 w-full resize-none overflow-y-auto bg-base-100 text-sm leading-relaxed"
              placeholder="Type the first message to hand off to /bots..."
              :disabled="!botStore.currentBot"
            />

            <div
              class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
            >
              <div
                class="shrink-0 border-b border-base-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Live Preview
              </div>

              <div
                class="min-h-0 flex-1 overflow-y-auto px-3 py-3 text-sm leading-relaxed"
              >
                {{ launchMessage || 'No message yet...' }}
              </div>
            </div>
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
      `Hey ${botStore.currentBot.name}, let’s make something strange, clever, and unexpectedly excellent.`,
    )
    queuePromptOffsetRefresh()
    return
  }

  botStore.setPendingLaunchMessage(
    'Let’s make something strange, clever, and unexpectedly excellent.',
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
