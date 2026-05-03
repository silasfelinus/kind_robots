<!-- /components/navigation/bot-footer.vue -->
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
          <img
            :src="selectedBotImage"
            :alt="selectedBotName"
            class="h-9 w-9 shrink-0 rounded-xl border border-base-300 object-cover"
          />

          <div class="hidden min-w-0 sm:block">
            <div class="truncate text-sm font-bold">
              {{ selectedBotName }}
            </div>

            <div class="truncate text-xs text-base-content/50">
              {{ botCountLabel }}
            </div>
          </div>
        </section>

        <textarea
          ref="messageMeasureRef"
          v-model="launchMessage"
          class="textarea textarea-bordered h-full min-h-0 min-w-0 resize-none overflow-y-auto rounded-2xl bg-base-100 px-3 py-2 text-sm leading-snug"
          placeholder="Give your bot a first line..."
          :disabled="!botStore.currentBot"
          @input="queuePromptOffsetRefresh"
          @keydown.enter.exact.prevent="launchBot"
        />

        <button
          type="button"
          class="btn btn-sm btn-primary h-full shrink-0 rounded-2xl text-white"
          :disabled="!canLaunch"
          @click="launchBot"
        >
          Send
        </button>

        <button
          type="button"
          class="btn btn-sm btn-secondary h-full shrink-0 rounded-2xl"
          @click="openBots"
        >
          Open
        </button>
      </div>
    </template>

    <template v-else-if="isOpen">
      <div
        class="grid h-full min-h-0 w-full grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]"
      >
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
          >
            <div>
              <h2 class="text-sm font-bold text-base-content">Bots</h2>

              <p class="text-xs text-base-content/50">
                Pick your assistant goblin.
              </p>
            </div>

            <span class="badge badge-outline text-xs">
              {{ botStore.visibleBots.length }}
            </span>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-2">
            <button
              v-for="bot in botStore.visibleBots"
              :key="`open-${bot.id}`"
              type="button"
              class="mb-1.5 flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition"
              :class="
                botStore.currentBot?.id === bot.id
                  ? 'border-primary bg-primary/10 text-primary'
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
                  {{ bot.description || bot.subtitle || 'Ready.' }}
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
            <template v-if="botStore.currentBot">
              <img
                :src="selectedBotImage"
                :alt="selectedBotName"
                class="h-14 w-14 shrink-0 rounded-2xl border border-base-300 object-cover"
              />

              <div class="min-w-0 flex-1">
                <div class="truncate text-base font-bold">
                  {{ selectedBotName }}
                </div>

                <div class="line-clamp-2 text-xs text-base-content/65">
                  {{ selectedBotSummary }}
                </div>
              </div>

              <button
                type="button"
                class="btn btn-xs btn-ghost shrink-0 rounded-xl"
                @click="clearSelectedBot"
              >
                Clear
              </button>
            </template>

            <p v-else class="text-sm text-base-content/40">
              Select a bot from the list.
            </p>
          </div>

          <section
            class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
          >
            <div
              class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
            >
              <span class="text-sm font-semibold">Opening Message</span>

              <div class="flex gap-1.5">
                <button
                  type="button"
                  class="btn btn-xs btn-ghost rounded-xl"
                  @click="fillStarter"
                >
                  Starter
                </button>

                <button
                  type="button"
                  class="btn btn-xs btn-ghost rounded-xl"
                  @click="fillWeirdStarter"
                >
                  Weird
                </button>

                <button
                  type="button"
                  class="btn btn-xs btn-ghost rounded-xl"
                  @click="resetFooter"
                >
                  Clear
                </button>

                <button
                  type="button"
                  class="btn btn-xs btn-primary rounded-xl text-white"
                  :disabled="!canLaunch"
                  @click="launchBot"
                >
                  Open
                </button>
              </div>
            </div>

            <textarea
              ref="messageMeasureRef"
              v-model="launchMessage"
              class="textarea min-h-0 flex-1 resize-none overflow-y-auto bg-base-100 px-3 py-2.5 text-sm leading-relaxed"
              placeholder="Type the first message to hand off to /bots..."
              :disabled="!botStore.currentBot"
              @input="queuePromptOffsetRefresh"
              @keydown.enter.exact.prevent="launchBot"
            />
          </section>
        </section>
      </div>
    </template>

    <template v-else>
      <div
        class="grid h-full min-h-0 w-full grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] gap-3 overflow-hidden"
      >
        <section
          class="min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <bot-gallery
            variant="row"
            title="Bot Shelf"
            subtitle="Choose a bot"
            :show-images="true"
            :show-controls="false"
            :show-toolbar="false"
            :show-card-actions="false"
            :show-descriptions="true"
            :show-meta="false"
            :show-launch-button="false"
            :compact="true"
          />
        </section>

        <section
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="border-b border-base-300 px-4 py-3">
            <template v-if="botStore.currentBot">
              <div class="flex items-start gap-3">
                <img
                  :src="selectedBotImage"
                  :alt="selectedBotName"
                  class="h-20 w-20 shrink-0 rounded-2xl border border-base-300 object-cover"
                />

                <div class="min-w-0 flex-1">
                  <div class="truncate text-lg font-bold">
                    {{ selectedBotName }}
                  </div>

                  <div
                    v-if="botStore.currentBot.subtitle"
                    class="truncate text-sm italic text-base-content/55"
                  >
                    {{ botStore.currentBot.subtitle }}
                  </div>

                  <div
                    class="mt-1 line-clamp-3 text-sm leading-relaxed text-base-content/70"
                  >
                    {{ selectedBotSummary }}
                  </div>
                </div>

                <button
                  type="button"
                  class="btn btn-xs btn-ghost rounded-xl"
                  @click="clearSelectedBot"
                >
                  Clear
                </button>
              </div>

              <div
                v-if="botStore.currentBot.personality"
                class="mt-3 rounded-2xl border border-base-300 bg-base-200/60 px-3 py-2 text-sm leading-relaxed text-base-content/70"
              >
                <div
                  class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-base-content/40"
                >
                  Personality
                </div>

                {{ botStore.currentBot.personality }}
              </div>
            </template>

            <div v-else class="text-sm text-base-content/40">
              Select a bot to see details and open a conversation.
            </div>
          </div>

          <div class="flex min-h-0 flex-col overflow-hidden">
            <div
              class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-4 py-2"
            >
              <span class="text-sm font-semibold">Opening Message</span>

              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  class="btn btn-xs btn-ghost rounded-xl"
                  @click="fillStarter"
                >
                  Starter
                </button>

                <button
                  type="button"
                  class="btn btn-xs btn-ghost rounded-xl"
                  @click="fillWeirdStarter"
                >
                  Weird
                </button>

                <button
                  type="button"
                  class="btn btn-xs btn-ghost rounded-xl"
                  @click="resetFooter"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              ref="messageMeasureRef"
              v-model="launchMessage"
              class="textarea min-h-0 flex-1 resize-none overflow-y-auto bg-base-100 px-4 py-3 text-sm leading-relaxed"
              placeholder="Type the first message to hand off to /bots..."
              :disabled="!botStore.currentBot"
              @input="queuePromptOffsetRefresh"
              @keydown.enter.exact.prevent="launchBot"
            />
          </div>

          <div class="border-t border-base-300 bg-base-200/60 px-4 py-3">
            <div class="flex items-end justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div
                  class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-base-content/40"
                >
                  Preview
                </div>

                <p
                  v-if="launchMessage.trim()"
                  class="line-clamp-3 text-sm leading-relaxed text-base-content/65"
                >
                  {{ launchMessage }}
                </p>

                <p v-else class="text-sm text-base-content/35">
                  Your opening prompt preview will show here.
                </p>
              </div>

              <button
                type="button"
                class="btn btn-sm btn-primary shrink-0 rounded-2xl text-white"
                :disabled="!canLaunch"
                @click="launchBot"
              >
                Open in Bots
              </button>
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBotStore } from '@/stores/botStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore } from '@/stores/navStore'

const router = useRouter()
const botStore = useBotStore()
const displayStore = useDisplayStore()
const navStore = useNavStore()

const footerOffsetKey = 'kind'

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

const launchMessage = computed({
  get: () => botStore.pendingLaunchMessage,
  set: (value: string) => botStore.setPendingLaunchMessage(value),
})

const messageMeasureRef = ref<HTMLTextAreaElement | null>(null)
let messageResizeObserver: ResizeObserver | null = null

const selectedBotName = computed(() => {
  return botStore.currentBot?.name || 'Bots'
})

const selectedBotImage = computed(() => {
  return botStore.currentBot?.avatarImage || '/images/bot.webp'
})

const selectedBotSummary = computed(() => {
  return (
    botStore.currentBot?.description ||
    botStore.currentBot?.subtitle ||
    botStore.currentBot?.tagline ||
    'A bot of mystery. Suspiciously helpful.'
  )
})

const botCountLabel = computed(() => {
  const count = botStore.visibleBots.length

  return `${count} bot${count === 1 ? '' : 's'} loaded`
})

const canLaunch = computed(() => {
  return Boolean(botStore.currentBot && launchMessage.value.trim())
})

async function selectBot(botId: number) {
  await botStore.selectBot(botId)
  queuePromptOffsetRefresh()
}

function clearSelectedBot() {
  botStore.deselectBot()
  displayStore.clearPromptOffset(footerOffsetKey)
}

function fillStarter() {
  const name = botStore.currentBot?.name || 'bot'

  botStore.setPendingLaunchMessage(
    `Hey ${name}, I want your help with something.`,
  )

  queuePromptOffsetRefresh()
}

function fillWeirdStarter() {
  const name = botStore.currentBot?.name || 'bot'

  botStore.setPendingLaunchMessage(
    `Hey ${name}, let's make something strange, clever, and unexpectedly excellent.`,
  )

  queuePromptOffsetRefresh()
}

function resetFooter() {
  botStore.clearPendingLaunchMessage()
  queuePromptOffsetRefresh()
}

async function openBots() {
  navStore.setDashboardTab('bot', 'overview')
  await router.push('/bots')
}

async function launchBot() {
  if (!canLaunch.value) return

  navStore.setDashboardTab('bot', 'interact')
  await router.push('/bots')
}

function refreshPromptOffset() {
  if (displayStore.footerComponent !== footerOffsetKey) {
    displayStore.clearPromptOffset(footerOffsetKey)
    return
  }

  if (footerState.value === 'hidden') {
    displayStore.clearPromptOffset(footerOffsetKey)
    return
  }

  if (footerState.value === 'priority') {
    displayStore.clearPromptOffset(footerOffsetKey)
    return
  }

  const el = messageMeasureRef.value

  if (!el || !botStore.currentBot) {
    displayStore.clearPromptOffset(footerOffsetKey)
    return
  }

  displayStore.refreshPromptOffset(
    footerOffsetKey,
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

onMounted(async () => {
  await Promise.all([
    botStore.initialize({
      fetchRemote: true,
      initializeServerStore: false,
      createBlankForm: true,
    }),
    navStore.initialize(),
  ])

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
  displayStore.clearPromptOffset(footerOffsetKey)
})
</script>