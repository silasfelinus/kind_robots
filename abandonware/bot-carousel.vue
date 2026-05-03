<!-- /components/content/bots/bot-carousel.vue -->
<template>
  <div
    class="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
  >
    <div
      class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
    >
      <div class="min-w-0">
        <div class="truncate text-sm font-semibold">
          {{ titleText }}
        </div>
        <div v-if="subtitleText" class="truncate text-xs text-base-content/60">
          {{ subtitleText }}
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <div class="badge badge-outline text-xs">
          {{ filteredBots.length }}
        </div>
        <button
          type="button"
          class="btn btn-xs btn-ghost"
          aria-label="Previous bot"
          @click="selectPrevious"
        >
          <icon name="kind-icon:chevron-left" class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="btn btn-xs btn-ghost"
          aria-label="Next bot"
          @click="selectNext"
        >
          <icon name="kind-icon:chevron-right" class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div
      v-if="selectedBot && showHero"
      class="shrink-0 border-b border-base-300 p-3"
    >
      <div
        class="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3"
      >
        <img
          :src="selectedBot.avatarImage || fallbackImage"
          :alt="selectedBot.name || 'Bot avatar'"
          class="h-16 w-16 shrink-0 rounded-2xl border border-base-300 object-cover"
        />

        <div class="min-w-0 flex-1">
          <div class="truncate text-base font-bold">
            {{ selectedBot.name || 'Unnamed Bot' }}
          </div>

          <div class="truncate text-xs text-base-content/55">
            {{
              selectedBot.subtitle ||
              selectedBot.designer ||
              ownershipLabel(selectedBot)
            }}
          </div>

          <div
            class="line-clamp-2 text-xs leading-relaxed text-base-content/65"
          >
            {{ selectedBot.description || 'A bot of mystery.' }}
          </div>
        </div>

        <div class="flex shrink-0 flex-col gap-1">
          <div v-if="isOwned(selectedBot)" class="badge badge-primary badge-sm">
            mine
          </div>
          <div
            v-if="selectedBot.underConstruction"
            class="badge badge-warning badge-sm"
          >
            wip
          </div>
        </div>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        v-if="showRail"
        ref="railRef"
        class="shrink-0 overflow-x-auto border-b border-base-300 px-3 py-3"
      >
        <div class="flex gap-2">
          <button
            v-for="bot in filteredBots"
            :key="`rail-${bot.id}`"
            :id="`bot-rail-${bot.id}`"
            type="button"
            class="flex w-24 shrink-0 flex-col items-center gap-2 rounded-2xl border p-2 text-center transition"
            :class="cardClasses(bot.id)"
            @click="selectBot(bot.id)"
          >
            <img
              :src="bot.avatarImage || fallbackImage"
              :alt="bot.name || 'Bot avatar'"
              class="h-14 w-14 rounded-2xl border border-base-300 object-cover"
            />
            <div class="w-full truncate text-xs font-semibold">
              {{ bot.name || 'Unnamed' }}
            </div>
          </button>
        </div>
      </div>

      <div ref="listRef" class="min-h-0 flex-1 overflow-y-auto p-3">
        <div
          :class="
            compactCards
              ? 'grid grid-cols-1 gap-2'
              : 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2'
          "
        >
          <button
            v-for="bot in filteredBots"
            :key="`card-${bot.id}`"
            :id="`bot-card-${bot.id}`"
            type="button"
            class="group flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition"
            :class="cardClasses(bot.id)"
            @click="selectBot(bot.id)"
          >
            <img
              :src="bot.avatarImage || fallbackImage"
              :alt="bot.name || 'Bot avatar'"
              class="h-12 w-12 shrink-0 rounded-2xl border border-base-300 object-cover"
            />

            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-semibold">
                {{ bot.name || 'Unnamed Bot' }}
              </div>
              <div class="truncate text-xs text-base-content/55">
                {{ bot.subtitle || bot.designer || ownershipLabel(bot) }}
              </div>
              <div class="line-clamp-2 text-xs text-base-content/65">
                {{ bot.description || 'Choose a bot to get started.' }}
              </div>
            </div>

            <div class="flex shrink-0 flex-col items-end gap-1">
              <div v-if="isOwned(bot)" class="badge badge-primary badge-sm">
                mine
              </div>
              <div
                v-if="bot.underConstruction"
                class="badge badge-warning badge-sm"
              >
                wip
              </div>
            </div>
          </button>
        </div>
      </div>

      <div
        v-if="showExpandedPanel && selectedBot"
        class="shrink-0 border-t border-base-300 bg-base-200/70 p-3"
      >
        <div
          class="grid grid-cols-1 gap-3 lg:grid-cols-[5rem_minmax(0,1fr)_auto]"
        >
          <img
            :src="selectedBot.avatarImage || fallbackImage"
            :alt="selectedBot.name || 'Bot avatar'"
            class="h-20 w-20 rounded-2xl border border-base-300 object-cover"
          />

          <div
            class="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <div class="flex flex-wrap items-center gap-2">
              <div class="truncate text-base font-bold">
                {{ selectedBot.name || 'Unnamed Bot' }}
              </div>
              <div
                v-if="isOwned(selectedBot)"
                class="badge badge-primary badge-sm"
              >
                yours
              </div>
            </div>

            <div class="text-xs text-base-content/55">
              {{
                selectedBot.subtitle ||
                selectedBot.designer ||
                ownershipLabel(selectedBot)
              }}
            </div>

            <div class="mt-2 text-sm leading-relaxed text-base-content/75">
              {{
                selectedBot.description ||
                'A suspiciously mysterious little robot.'
              }}
            </div>

            <div
              v-if="selectedBot.personality"
              class="mt-2 line-clamp-3 text-xs leading-relaxed text-base-content/65"
            >
              {{ selectedBot.personality }}
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <button
              type="button"
              class="btn btn-sm btn-primary"
              @click.stop="emitSelected(selectedBot.id)"
            >
              Use
            </button>

            <button
              v-if="showEditActions && isOwned(selectedBot)"
              type="button"
              class="btn btn-sm btn-secondary"
              @click.stop="emitEdit(selectedBot.id)"
            >
              Edit
            </button>

            <button
              type="button"
              class="btn btn-sm btn-ghost"
              @click.stop="scrollSelectedIntoView"
            >
              Center
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
// /components/content/bots/bot-carousel.vue
import { computed, onMounted, ref } from 'vue'
import { useBotStore } from '@/stores/botStore'
import { useUserStore } from '@/stores/userStore'

type BotLike = {
  id: number
  userId?: number | null
  name?: string | null
  subtitle?: string | null
  description?: string | null
  designer?: string | null
  personality?: string | null
  avatarImage?: string | null
  isPublic?: boolean | null
  underConstruction?: boolean | null
}

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    ownedOnly?: boolean
    showHero?: boolean
    showRail?: boolean
    showExpandedPanel?: boolean
    showEditActions?: boolean
    compactCards?: boolean
    autoSelectFirst?: boolean
  }>(),
  {
    title: 'Bot Carousel',
    subtitle: 'Browse bots, pick favorites, and jump into chat.',
    ownedOnly: false,
    showHero: true,
    showRail: true,
    showExpandedPanel: false,
    showEditActions: false,
    compactCards: true,
    autoSelectFirst: true,
  },
)

const emit = defineEmits<{
  selected: [botId: number]
  edit: [botId: number]
}>()

const botStore = useBotStore()
const userStore = useUserStore()

const railRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

const fallbackImage = '/images/bot.webp'

const titleText = computed(() => props.title)
const subtitleText = computed(() => props.subtitle)

const bots = computed<BotLike[]>(() => (botStore.bots || []) as BotLike[])
const selectedBot = computed<BotLike | null>(
  () => (botStore.currentBot as BotLike | null) || null,
)

const filteredBots = computed(() => {
  if (!props.ownedOnly) return bots.value
  return bots.value.filter(
    (bot) => Number(bot.userId) === Number(userStore.userId),
  )
})

function isOwned(bot: BotLike) {
  return Number(bot.userId) === Number(userStore.userId)
}

function ownershipLabel(bot: BotLike) {
  if (isOwned(bot)) return 'Your bot'
  return bot.isPublic ? 'Public bot' : 'Private bot'
}

function cardClasses(botId: number) {
  return selectedBot.value?.id === botId
    ? 'border-primary bg-primary/10'
    : 'border-base-300 bg-base-100 hover:bg-base-200'
}

async function selectBot(botId: number) {
  await botStore.selectBot(botId)
  emit('selected', botId)
  scrollSelectedIntoView()
}

function emitSelected(botId: number) {
  emit('selected', botId)
}

function emitEdit(botId: number) {
  emit('edit', botId)
}

function getBotAt(index: number): BotLike | null {
  const bot = filteredBots.value[index]
  return bot ?? null
}

async function selectPrevious() {
  if (filteredBots.value.length === 0) return

  if (!selectedBot.value) {
    const firstBot = getBotAt(0)
    if (!firstBot) return
    await selectBot(firstBot.id)
    return
  }

  const currentIndex = filteredBots.value.findIndex(
    (bot) => bot.id === selectedBot.value?.id,
  )

  const targetIndex =
    currentIndex <= 0 ? filteredBots.value.length - 1 : currentIndex - 1

  const targetBot = getBotAt(targetIndex)
  if (!targetBot) return

  await selectBot(targetBot.id)
}

async function selectNext() {
  if (filteredBots.value.length === 0) return

  if (!selectedBot.value) {
    const firstBot = getBotAt(0)
    if (!firstBot) return
    await selectBot(firstBot.id)
    return
  }

  const currentIndex = filteredBots.value.findIndex(
    (bot) => bot.id === selectedBot.value?.id,
  )

  const targetIndex =
    currentIndex >= filteredBots.value.length - 1 ? 0 : currentIndex + 1

  const targetBot = getBotAt(targetIndex)
  if (!targetBot) return

  await selectBot(targetBot.id)
}

function scrollSelectedIntoView() {
  const id = selectedBot.value?.id
  if (!id) return

  requestAnimationFrame(() => {
    const railTarget = document.getElementById(`bot-rail-${id}`)
    const listTarget = document.getElementById(`bot-card-${id}`)

    railTarget?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })

    listTarget?.scrollIntoView({
      behavior: 'smooth',
      inline: 'nearest',
      block: 'nearest',
    })
  })
}

onMounted(async () => {
  if (!bots.value.length) {
    await botStore.initialize()
  }

  if (props.autoSelectFirst && !selectedBot.value) {
    const firstBot = getBotAt(0)
    if (!firstBot) return
    await botStore.selectBot(firstBot.id)
  }
})
</script>
