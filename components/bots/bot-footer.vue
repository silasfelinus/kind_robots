<!-- /components/navigation/bot-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <div v-if="isCompact" class="flex h-full w-full min-h-0">
      <div
        v-if="botStore.currentBot"
        class="grid h-full w-full min-h-0 grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-2 py-2"
      >
        <img
          :src="botStore.currentBot.avatarImage || '/images/bot.webp'"
          :alt="botStore.currentBot.name || 'Bot avatar'"
          class="h-12 w-12 rounded-2xl border border-base-300 object-cover"
        />

        <div class="flex min-w-0 flex-col gap-1">
          <div class="truncate text-sm font-semibold">
            {{ botStore.currentBot.name || 'AMIbot' }}
          </div>

          <textarea
            v-model="launchMessage"
            class="textarea textarea-bordered h-16 min-h-0 w-full resize-none overflow-y-auto bg-base-100 px-3 py-2 text-sm leading-snug"
            placeholder="Give your bot a first line..."
          />
        </div>

        <div class="flex h-full flex-col items-end justify-between gap-2">
          <button class="btn btn-xs btn-ghost" @click="clearSelectedBot">
            Back
          </button>

          <button
            class="btn btn-sm btn-primary text-white"
            :disabled="!launchMessage.trim()"
            @click="launchBot"
          >
            Open
          </button>
        </div>
      </div>

      <div
        v-else
        class="flex h-full w-full items-center gap-2 overflow-x-auto rounded-2xl border border-base-300 bg-base-100 px-2 py-2"
      >
        <button
          v-for="bot in bots"
          :key="bot.id"
          class="flex h-full min-w-48 shrink-0 items-center gap-2 rounded-2xl border border-base-300 bg-base-200 px-2 py-2 text-left transition hover:bg-base-300"
          @click="selectBot(bot.id)"
        >
          <img
            :src="bot.avatarImage || '/images/bot.webp'"
            :alt="bot.name || 'Bot avatar'"
            class="h-12 w-12 rounded-2xl border border-base-300 object-cover"
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
      </div>
    </div>

    <div
      v-else
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 xl:grid-cols-[1.2fr_1fr]"
    >
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-semibold">🤖 Bot Footer</h2>

          <button
            class="btn btn-sm btn-primary font-semibold text-white"
            :disabled="!botStore.currentBot || !launchMessage.trim()"
            @click="launchBot"
          >
            Open in Bots
          </button>
        </div>

        <div
          class="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(14rem,18rem)_1fr]"
        >
          <div class="flex min-h-0 flex-col gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="mb-2 text-sm font-semibold">Choose Bot</div>

              <div class="flex max-h-48 min-h-0 flex-col gap-2 overflow-y-auto">
                <button
                  v-for="bot in bots"
                  :key="bot.id"
                  class="flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition"
                  :class="
                    botStore.currentBot?.id === bot.id
                      ? 'border-primary bg-primary/10'
                      : 'border-base-300 bg-base-100 hover:bg-base-200'
                  "
                  @click="selectBot(bot.id)"
                >
                  <img
                    :src="bot.avatarImage || '/images/bot.webp'"
                    :alt="bot.name || 'Bot avatar'"
                    class="h-14 w-14 rounded-2xl border border-base-300 object-cover"
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

            <div
              v-if="botStore.currentBot"
              class="rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="flex items-center gap-3">
                <img
                  :src="botStore.currentBot.avatarImage || '/images/bot.webp'"
                  :alt="botStore.currentBot.name || 'Bot avatar'"
                  class="h-16 w-16 rounded-2xl border border-base-300 object-cover"
                />

                <div class="min-w-0 flex-1">
                  <div class="truncate text-lg font-semibold">
                    {{ botStore.currentBot.name || 'AMIbot' }}
                  </div>
                  <div class="line-clamp-3 text-sm text-base-content/70">
                    {{
                      botStore.currentBot.description ||
                      'A mysterious bot awaits your first message.'
                    }}
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else
              class="flex items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-center text-sm text-base-content/70"
            >
              Pick a bot to unlock the message panel.
            </div>
          </div>

          <div class="flex min-h-0 flex-col gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="mb-2 flex items-center justify-between gap-2">
                <div class="text-sm font-semibold">Opening Message</div>

                <div class="flex flex-wrap gap-2">
                  <button class="btn btn-xs btn-secondary" @click="fillStarter">
                    Starter
                  </button>
                  <button
                    class="btn btn-xs btn-accent"
                    @click="fillWeirdStarter"
                  >
                    Weird
                  </button>
                  <button class="btn btn-xs btn-warning" @click="resetFooter">
                    Reset
                  </button>
                </div>
              </div>

              <div class="flex min-h-0 flex-1 flex-col gap-3">
                <textarea
                  v-model="launchMessage"
                  class="textarea textarea-bordered h-32 min-h-32 w-full resize-none bg-base-100 text-sm"
                  placeholder="Type the first message to hand off to /bots..."
                  :disabled="!botStore.currentBot"
                />

                <div
                  class="flex min-h-0 flex-1 flex-col rounded-2xl border border-base-300 bg-base-100 p-3"
                >
                  <div
                    class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60"
                  >
                    Ready to send
                  </div>

                  <div
                    class="min-h-0 flex-1 overflow-y-auto text-sm leading-relaxed"
                  >
                    {{ launchMessage || 'No message yet...' }}
                  </div>
                </div>
              </div>
            </div>

            <div
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/70"
            >
              This footer is for setup only. When you are ready, it punts you to
              <span class="font-semibold">/bots</span> to actually fire it up.
            </div>
          </div>
        </div>
      </div>

      <div class="hidden min-h-0 xl:flex xl:flex-col">
        <div
          class="flex h-full min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
        >
          <div
            class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
          >
            Bot Gallery
          </div>

          <div class="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto">
            <button
              v-for="bot in bots"
              :key="`gallery-${bot.id}`"
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
                class="h-16 w-16 rounded-2xl border border-base-300 object-cover"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/bot-footer.vue
import { computed, onMounted } from 'vue'
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

const bots = computed<BotLike[]>(() => botStore.bots as BotLike[])

const launchMessage = computed({
  get: () => botStore.pendingLaunchMessage,
  set: (value: string) => botStore.setPendingLaunchMessage(value),
})

async function selectBot(botId: number) {
  await botStore.selectBot(botId)
}

function clearSelectedBot() {
  botStore.deselectBot()
}

function fillStarter() {
  if (botStore.currentBot?.name) {
    botStore.setPendingLaunchMessage(
      `Hey ${botStore.currentBot.name}, I want your help with something.`,
    )
    return
  }

  botStore.setPendingLaunchMessage('Hey bot, I want your help with something.')
}

function fillWeirdStarter() {
  if (botStore.currentBot?.name) {
    botStore.setPendingLaunchMessage(
      `Hey ${botStore.currentBot.name}, let’s make something strange, clever, and unexpectedly excellent.`,
    )
    return
  }

  botStore.setPendingLaunchMessage(
    'Let’s make something strange, clever, and unexpectedly excellent.',
  )
}

function resetFooter() {
  botStore.clearPendingLaunchMessage()
}

async function launchBot() {
  if (!botStore.currentBot || !botStore.pendingLaunchMessage.trim()) return
  await router.push('/bots')
}

onMounted(async () => {
  await botStore.initialize()
})
</script>
