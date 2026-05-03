<!-- /components/content/bots/bot-gallery.vue -->
<template>
  <div class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3">
    <header
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
              {{ botStore.currentBot.name || 'Unnamed Bot' }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
            {{ subtitle }}
          </p>
        </div>

        <span v-if="!isLoading" class="badge badge-ghost shrink-0">
          {{ filteredBots.length }}
        </span>
      </div>

      <div
        v-if="showControls"
        class="flex flex-col gap-2 lg:flex-row lg:items-center"
      >
        <select
          v-model="scope"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter bots by scope"
        >
          <option value="visible">Visible</option>
          <option value="mine">Mine</option>
          <option value="public">Public</option>
          <option value="ready">Ready</option>
          <option value="all">All loaded</option>
        </select>

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
      </div>

      <div v-if="showToolbar" class="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingBot"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add
        </button>

        <button
          v-if="allowEdit"
          class="btn btn-secondary btn-sm rounded-xl"
          type="button"
          :disabled="!botStore.currentBot"
          @click="startEditingSelectedBot"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
          Edit
        </button>

        <button
          v-if="allowClone"
          class="btn btn-accent btn-sm rounded-xl"
          type="button"
          :disabled="!botStore.currentBot"
          @click="cloneSelectedBot"
        >
          <Icon name="kind-icon:copy" class="h-4 w-4" />
          Clone
        </button>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="!botStore.currentBot"
          @click="clearSelectedBot"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>

        <button
          v-if="allowRefresh"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading"
          @click="refreshBots(true)"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <section
      v-if="showBotForm"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-bold text-base-content">
          {{ formTitle }}
        </h3>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          @click="closeBotForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <add-bot :mode="formMode" @saved="handleBotSaved" @cancel="closeBotForm" />
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

      <div
        v-else-if="filteredBots.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:robot" class="h-12 w-12 text-primary" />

        <div>
          <p class="text-lg font-bold">No bots found.</p>
          <p class="mt-1 text-sm">
            Either the bot shelf is empty, or the filters are being dramatic.
          </p>
        </div>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingBot"
        >
          Build the first bot
        </button>
      </div>

      <div v-else-if="variant === 'dropdown'" class="flex flex-col gap-2">
        <select
          class="select select-bordered w-full bg-base-100"
          :value="botStore.currentBot?.id ?? ''"
          aria-label="Select bot"
          @change="selectBotFromEvent"
        >
          <option value="">Choose a bot</option>

          <option v-for="bot in filteredBots" :key="bot.id" :value="bot.id">
            {{ bot.name || `Bot ${bot.id}` }}
          </option>
        </select>
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
          :show-server="showServer"
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Bot } from '~/prisma/generated/prisma/client'
import { useRouter } from 'vue-router'
import { useBotStore } from '@/stores/botStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'
type BotScope = 'visible' | 'mine' | 'public' | 'ready' | 'all'
type ConstructionFilter = 'all' | 'ready' | 'building'

const props = withDefaults(
  defineProps<{
    variant?: GalleryVariant
    title?: string
    subtitle?: string
    showImages?: boolean
    showControls?: boolean
    showToolbar?: boolean
    showCardActions?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    showServer?: boolean
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
    showImages: true,
    showControls: true,
    showToolbar: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    showServer: true,
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

const router = useRouter()
const botStore = useBotStore()
const navStore = useNavStore()
const userStore = useUserStore()

const scope = ref<BotScope>('visible')
const constructionFilter = ref<ConstructionFilter>('all')
const searchQuery = ref('')
const isLoading = ref(false)
const showBotForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const isCompact = computed(
  () =>
    props.compact || props.variant === 'row' || props.variant === 'dropdown',
)

const formTitle = computed(() =>
  formMode.value === 'edit' ? 'Edit Bot' : 'Add Bot',
)

const layoutClass = computed(() =>
  props.variant === 'row' ? 'bot-row' : 'bot-grid',
)

const baseBots = computed<Bot[]>(() => {
  if (scope.value === 'mine') return botStore.ownedBots
  if (scope.value === 'public') return botStore.publicBots
  if (scope.value === 'ready') return botStore.readyBots
  if (scope.value === 'all') return botStore.bots

  return botStore.visibleBots
})

const filteredBots = computed<Bot[]>(() => {
  let bots = baseBots.value

  if (constructionFilter.value === 'ready') {
    bots = bots.filter((bot) => !bot.underConstruction)
  }

  if (constructionFilter.value === 'building') {
    bots = bots.filter((bot) => bot.underConstruction)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()

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
        bot.serverName,
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

async function refreshBots(force = false) {
  isLoading.value = true

  try {
    await botStore.initialize({
      force,
      fetchRemote: true,
      initializeServerStore: true,
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
  await router.push('/bots')
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