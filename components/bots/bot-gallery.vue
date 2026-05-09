<!-- /components/content/bots/bot-gallery.vue -->
<template>
  <section
    class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      v-if="showHeader"
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ title }}
          </h2>

          <p
            v-if="botStore.currentBot"
            class="truncate text-sm text-base-content/70"
          >
            Selected:
            <span class="font-semibold text-primary">
              {{ selectedBotTitle }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
            {{ subtitle }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <span
            v-if="!isLoading && !botStore.loading"
            class="badge badge-ghost"
          >
            {{ filteredBots.length }}
          </span>

          <button
            v-if="allowAdd && !isDropdownMode"
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="startAddingBot"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            <span class="hidden sm:inline">Add</span>
          </button>

          <button
            v-if="allowRefresh && !isDropdownMode"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isLoading || botStore.loading"
            @click="refreshBots(true)"
          >
            <span
              v-if="isLoading || botStore.loading"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div
        v-if="showControls && !isDropdownMode"
        class="grid grid-cols-1 gap-2 lg:grid-cols-[auto_auto_minmax(0,1fr)_auto]"
      >
        <label
          v-if="userStore.isAdmin"
          class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-2"
        >
          <span class="label-text font-bold">Show Mature</span>

          <input
            v-model="showMature"
            type="checkbox"
            class="toggle toggle-accent toggle-sm"
          />
        </label>

        <select
          v-model="constructionFilter"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter bots by construction status"
        >
          <option value="all">All statuses</option>
          <option value="ready">Ready only</option>
          <option value="building">Under construction</option>
        </select>

        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search bots..."
          class="input input-bordered input-sm w-full bg-base-100"
          aria-label="Search bots"
        />

        <button
          class="btn btn-ghost btn-sm rounded-xl lg:w-auto"
          type="button"
          :disabled="!botStore.currentBot"
          @click="clearSelectedBot"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>
      </div>
    </header>

    <section
      v-if="showBotForm"
      class="shrink-0 rounded-2xl border border-primary/30 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="truncate text-base font-black text-primary">
            {{ formTitle }}
          </h3>

          <p class="text-sm text-base-content/60">
            {{ formSubtitle }}
          </p>
        </div>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          @click="closeBotForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          <span class="hidden sm:inline">Close</span>
        </button>
      </div>

      <add-bot
        :mode="formMode"
        @saved="handleBotSaved"
        @cancel="closeBotForm"
      />
    </section>

    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading || botStore.loading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div
        v-else-if="botStore.error"
        class="flex h-full items-center justify-center rounded-2xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        <p class="text-lg font-bold">
          {{ botStore.error }}
        </p>
      </div>

      <div v-else-if="isDropdownMode" class="flex flex-col gap-3">
        <div
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-primary/10"
              >
                <Icon name="kind-icon:robot" class="h-6 w-6 text-primary" />
              </div>

              <div class="min-w-0">
                <p class="text-xs font-bold uppercase text-base-content/50">
                  Current Bot
                </p>

                <h3 class="truncate text-base font-black text-base-content">
                  {{ selectedBotTitle }}
                </h3>

                <p class="truncate text-sm text-base-content/60">
                  {{ selectedBotSubtitle }}
                </p>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <button
                v-if="canLaunchSelected"
                class="btn btn-info btn-sm rounded-xl"
                type="button"
                @click="launchSelectedBot"
              >
                <Icon name="kind-icon:play" class="h-4 w-4" />
                <span class="hidden sm:inline">Launch</span>
              </button>

              <button
                v-if="canCloneSelected"
                class="btn btn-accent btn-sm rounded-xl"
                type="button"
                @click="cloneSelectedBot"
              >
                <Icon name="kind-icon:copy" class="h-4 w-4" />
                <span class="hidden sm:inline">Clone</span>
              </button>

              <button
                v-if="canEditSelected"
                class="btn btn-secondary btn-sm rounded-xl"
                type="button"
                @click="startEditingSelectedBot"
              >
                <Icon name="kind-icon:pencil" class="h-4 w-4" />
                <span class="hidden sm:inline">Edit</span>
              </button>
            </div>
          </div>

          <select
            class="select select-bordered w-full bg-base-200"
            :value="botStore.currentBot?.id ?? ''"
            aria-label="Select bot"
            @change="selectBotFromEvent"
          >
            <option value="">Choose a bot</option>

            <option v-for="bot in filteredBots" :key="bot.id" :value="bot.id">
              {{ getBotTitle(bot) }}
            </option>

            <option v-if="allowAdd" disabled>──────────</option>

            <option v-if="allowAdd" value="__add__">Add Bot</option>
          </select>

          <div
            v-if="botStore.currentBot"
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-xs text-base-content/70"
          >
            <p class="line-clamp-3">
              {{ selectedBotDescription }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="botStore.currentBot.isPublic"
                class="badge badge-info badge-sm"
              >
                Public
              </span>

              <span v-else class="badge badge-ghost badge-sm"> Private </span>

              <span
                v-if="botStore.currentBot.isMature"
                class="badge badge-warning badge-sm"
              >
                Mature
              </span>

              <span
                v-if="botStore.currentBot.underConstruction"
                class="badge badge-warning badge-sm"
              >
                Building
              </span>

              <span v-else class="badge badge-success badge-sm"> Ready </span>

              <span
                v-if="botStore.currentBot.BotType"
                class="badge badge-secondary badge-sm"
              >
                {{ botStore.currentBot.BotType }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="filteredBots.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:robot" class="h-12 w-12 text-primary" />

        <div>
          <p class="text-lg font-bold">No bots found.</p>

          <p class="mt-1 text-sm">
            No public or owned bots match this gallery.
          </p>
        </div>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingBot"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Build Bot
        </button>
      </div>

      <div v-else :class="layoutClass">
        <bot-card
          v-for="bot in filteredBots"
          :key="bot.id"
          :bot="bot"
          :selected="botStore.currentBot?.id === bot.id"
          :compact="isCompact"
          :show-image="showImages"
          :show-actions="showCardActions"
          :show-description="showDescriptions"
          :show-meta="showMeta"
          :show-personality="showPersonality"
          :show-launch-button="showLaunchButton"
          :show-debug="showDebug"
          :allow-edit="allowEdit"
          :allow-clone="allowClone"
          :allow-delete="allowDelete"
          @select="selectBot"
          @edit="startEditingBotById"
          @clone="cloneBotById"
          @delete="handleBotDeleted"
          @launch="launchBotById"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Bot } from '~/prisma/generated/prisma/client'
import { useBotStore } from '@/stores/botStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'
type ConstructionFilter = 'all' | 'ready' | 'building'

const props = withDefaults(
  defineProps<{
    variant?: GalleryVariant
    title?: string
    subtitle?: string
    showHeader?: boolean
    showImages?: boolean
    showControls?: boolean
    showCardActions?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    showPersonality?: boolean
    showLaunchButton?: boolean
    showDebug?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowClone?: boolean
    allowDelete?: boolean
    allowRefresh?: boolean
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    variant: 'dashboard',
    title: 'Bots',
    subtitle: 'Browse, select, add, edit, clone, or launch bots.',
    showHeader: true,
    showImages: true,
    showControls: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    showPersonality: false,
    showLaunchButton: true,
    showDebug: false,
    allowAdd: true,
    allowEdit: true,
    allowClone: true,
    allowDelete: true,
    allowRefresh: true,
    compact: false,
    autoLoad: true,
  },
)

const botStore = useBotStore()
const navStore = useNavStore()
const userStore = useUserStore()

const constructionFilter = ref<ConstructionFilter>('all')
const searchQuery = ref('')
const isLoading = ref(false)
const showBotForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const isDropdownMode = computed(() => props.variant === 'dropdown')

const isCompact = computed(() => {
  return props.compact || props.variant === 'row' || isDropdownMode.value
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'bot-row' : 'bot-grid'
})

const currentUserId = computed(() => {
  return userStore.userId ?? userStore.user?.id ?? null
})

const showMature = computed({
  get: () => userStore.user?.showMature ?? userStore.showMature ?? false,
  set: async (value: boolean) => {
    if (!userStore.user) return

    await userStore.updateUser({ showMature: value })
  },
})

const selectedBot = computed(() => {
  return botStore.currentBot
})

const selectedBotTitle = computed(() => {
  return selectedBot.value ? getBotTitle(selectedBot.value) : 'No bot selected'
})

const selectedBotSubtitle = computed(() => {
  const bot = selectedBot.value

  if (!bot) return 'Choose a bot or add a new one.'

  return bot.subtitle || bot.tagline || bot.BotType || 'Bot selected.'
})

const selectedBotDescription = computed(() => {
  const bot = selectedBot.value

  if (!bot) return 'No bot selected.'

  return (
    bot.description ||
    bot.personality ||
    bot.prompt ||
    bot.botIntro ||
    bot.userIntro ||
    'No bot description yet.'
  )
})

const formTitle = computed(() => {
  return formMode.value === 'edit' ? 'Edit Bot' : 'Add Bot'
})

const formSubtitle = computed(() => {
  return formMode.value === 'edit'
    ? 'Tune this bot before it develops lore.'
    : 'Create a new bot persona, module, or charming nonsense engine.'
})

const canEditSelected = computed(() => {
  const bot = selectedBot.value

  if (!props.allowEdit || !bot?.id) return false
  if (userStore.isAdmin) return true

  return bot.userId === currentUserId.value
})

const canCloneSelected = computed(() => {
  return Boolean(props.allowClone && selectedBot.value?.id)
})

const canLaunchSelected = computed(() => {
  return Boolean(selectedBot.value?.id)
})

const galleryBots = computed<Bot[]>(() => {
  let bots = botStore.bots

  if (!userStore.isAdmin) {
    bots = bots.filter((bot) => {
      return bot.isPublic || bot.userId === currentUserId.value
    })
  }

  if (!showMature.value) {
    bots = bots.filter((bot) => !bot.isMature)
  }

  return bots
})

const filteredBots = computed<Bot[]>(() => {
  let bots = galleryBots.value

  if (constructionFilter.value === 'ready') {
    bots = bots.filter((bot) => !bot.underConstruction)
  }

  if (constructionFilter.value === 'building') {
    bots = bots.filter((bot) => bot.underConstruction)
  }

  const query = searchQuery.value.trim().toLowerCase()

  if (query) {
    bots = bots.filter((bot) => {
      const haystack = [
        bot.name,
        bot.subtitle,
        bot.description,
        bot.personality,
        bot.tagline,
        bot.BotType,
        bot.theme,
        bot.modules,
        bot.designer,
        bot.prompt,
        bot.botIntro,
        bot.userIntro,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }

  return bots
})

onMounted(async () => {
  if (props.autoLoad) {
    await refreshBots()
  }
})

function getBotTitle(bot: Bot) {
  return bot.name || bot.subtitle || bot.tagline || `Bot ${bot.id}`
}

async function refreshBots(force = false) {
  isLoading.value = true

  try {
    await botStore.initialize({
      force,
      fetchRemote: true,
      initializeServerStore: false,
      createBlankForm: true,
    })
  } finally {
    isLoading.value = false
  }
}

async function selectBot(id: number) {
  await botStore.selectBot(id)
}

function selectBotFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement

  if (target.value === '__add__') {
    startAddingBot()
    return
  }

  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    clearSelectedBot()
    return
  }

  void selectBot(id)
}

function startAddingBot() {
  botStore.startAddingBot()
  formMode.value = 'add'
  showBotForm.value = true
}

async function startEditingSelectedBot() {
  const id = botStore.currentBot?.id

  if (!id) return

  await startEditingBotById(id)
}

async function startEditingBotById(id: number) {
  const bot = await botStore.startEditingBot(id)

  if (!bot) return

  formMode.value = 'edit'
  showBotForm.value = true
}

function cloneSelectedBot() {
  const id = botStore.currentBot?.id

  if (!id) return

  void cloneBotById(id)
}

async function cloneBotById(id: number) {
  const bot = await botStore.startCloningBot(id)

  if (!bot) return

  formMode.value = 'add'
  showBotForm.value = true
}

function launchSelectedBot() {
  const id = botStore.currentBot?.id

  if (!id) return

  void launchBotById(id)
}

function clearSelectedBot() {
  botStore.deselectBot()
  showBotForm.value = false
}

function closeBotForm() {
  showBotForm.value = false
}

async function handleBotSaved() {
  showBotForm.value = false
  await refreshBots(true)
}

function handleBotDeleted(id: number) {
  if (botStore.currentBot?.id === id) {
    botStore.deselectBot()
  }
}

async function launchBotById(id: number) {
  await botStore.selectBot(id)
  navStore.setDashboardTab('bot', 'interact')
}
</script>

<style scoped>
.bot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
  gap: 1rem;
}

.bot-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.bot-row > * {
  min-width: min(240px, 85vw);
  max-width: 360px;
}
</style>
