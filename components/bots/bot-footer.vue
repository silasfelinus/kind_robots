<!-- /components/navigation/bot-footer.vue -->
<template>
  <div
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl border border-base-300 bg-base-200/80 p-3 shadow-inner md:p-4"
  >
    <div class="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_1fr]">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow">
        <div class="flex h-full flex-col gap-3">
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

          <label class="form-control w-full">
            <div class="label pb-1">
              <span class="label-text font-semibold">Choose Bot</span>
            </div>
            <select
              :model-value="selectedBotIdString"
              class="select select-bordered w-full bg-base-100"
              @change="handleBotChange"
            >
              <option value="">Pick a bot companion...</option>
              <option v-for="bot in bots" :key="bot.id" :value="bot.id">
                {{ bot.name || 'Unnamed Bot' }}
              </option>
            </select>
          </label>

          <label class="form-control w-full">
            <div class="label pb-1">
              <span class="label-text font-semibold">Opening Message</span>
            </div>
            <textarea
              v-model="launchMessage"
              class="textarea textarea-bordered min-h-24 w-full resize-none bg-base-100 text-sm"
              placeholder="Type the first message to hand off to /bots..."
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button class="btn btn-sm btn-secondary" @click="fillStarter">
              ✨ Starter
            </button>
            <button class="btn btn-sm btn-accent" @click="fillWeirdStarter">
              🦋 Make It Weird
            </button>
            <button class="btn btn-sm btn-warning" @click="resetFooter">
              ♻️ Reset
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow">
        <div class="flex h-full flex-col gap-3">
          <h3
            class="text-sm font-semibold uppercase tracking-wide text-base-content/70"
          >
            Selected Bot
          </h3>

          <div
            v-if="botStore.currentBot"
            class="flex h-full min-h-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="flex items-center gap-3">
              <img
                :src="botStore.currentBot.avatarImage || '/images/bot.webp'"
                :alt="botStore.currentBot.name || 'Bot avatar'"
                class="h-20 w-20 rounded-2xl border border-base-300 object-cover"
              />

              <div class="min-w-0 flex-1">
                <h4 class="truncate text-lg font-semibold">
                  {{ botStore.currentBot.name || 'AMIbot' }}
                </h4>
                <p class="line-clamp-3 text-sm text-base-content/70">
                  {{
                    botStore.currentBot.description ||
                    'A mysterious bot awaits your first message.'
                  }}
                </p>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
              <p
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Ready to send
              </p>
              <p class="mt-2 text-sm">
                {{ launchMessage || 'No message yet...' }}
              </p>
            </div>
          </div>

          <div
            v-else
            class="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center text-sm text-base-content/70"
          >
            Pick a bot and give it an opening line.
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

type BotLike = {
  id: number
  name?: string | null
  description?: string | null
  avatarImage?: string | null
}

const router = useRouter()
const botStore = useBotStore()

const bots = computed<BotLike[]>(() => botStore.bots as BotLike[])

const selectedBotIdString = computed(() => {
  return botStore.selectedBotId ? String(botStore.selectedBotId) : ''
})

const launchMessage = computed({
  get: () => botStore.pendingLaunchMessage,
  set: (value: string) => botStore.setPendingLaunchMessage(value),
})

async function handleBotChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const botId = Number(target.value)

  if (!botId) {
    botStore.deselectBot()
    return
  }

  await botStore.selectBot(botId)
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
