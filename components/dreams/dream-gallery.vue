<!-- /components/dreams/dream-gallery.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
    <header
      v-if="showHeader"
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="min-w-0">
        <p class="text-xs font-black uppercase tracking-wide text-primary">
          Dream Atlas
        </p>
        <h2 class="text-2xl font-black text-base-content">Dream Gallery</h2>
        <p class="text-sm text-base-content/65">
          Browse Dream seeds, choose a world, then open it for chat, art, and model play.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl"
          :disabled="dreamStore.loading"
          @click="refresh"
        >
          <span v-if="dreamStore.loading" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>

        <button
          type="button"
          class="btn btn-primary btn-sm rounded-2xl text-white"
          @click="startNewDream"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          New Dream
        </button>
      </div>
    </header>

    <section
      v-if="showControls"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm"
    >
      <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_12rem_10rem_10rem_auto]">
        <label class="input input-bordered flex items-center gap-2 rounded-2xl bg-base-200">
          <Icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
          <input
            v-model="search"
            class="grow"
            type="search"
            placeholder="Search title, pitch, description, art prompt..."
          />
        </label>

        <select
          v-model="dreamTypeFilter"
          class="select select-bordered rounded-2xl bg-base-200"
        >
          <option value="">All types</option>
          <option v-for="type in dreamStore.dreamTypes" :key="type" :value="type">
            {{ dreamTypeLabel(type) }}
          </option>
        </select>

        <button
          type="button"
          class="btn rounded-2xl"
          :class="showMine ? 'btn-secondary' : 'btn-outline'"
          @click="showMine = !showMine"
        >
          <Icon name="kind-icon:user" class="h-4 w-4" />
          Mine
        </button>

        <button
          type="button"
          class="btn rounded-2xl"
          :class="showInactive ? 'btn-warning' : 'btn-outline'"
          @click="showInactive = !showInactive"
        >
          <Icon name="kind-icon:archive" class="h-4 w-4" />
          Archived
        </button>

        <select
          v-model="displayMode"
          class="select select-bordered rounded-2xl bg-base-200"
        >
          <option value="cards">Cards</option>
          <option value="dropdown">Dropdown</option>
        </select>
      </div>
    </section>

    <section
      v-if="displayMode === 'dropdown'"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <select
        class="select select-bordered w-full rounded-2xl bg-base-200"
        :value="selectedDreamId"
        @change="selectFromDropdown"
      >
        <option value="">Choose a Dream...</option>
        <option v-for="dream in filteredDreams" :key="dream.id" :value="dream.id">
          {{ dream.title }} · {{ dreamTypeLabel(dream.dreamType) }}
        </option>
      </select>
    </section>

    <section class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div
        v-if="filteredDreams.length && displayMode === 'cards'"
        class="grid grid-cols-1 gap-3 p-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      >
        <dream-card
          v-for="dream in filteredDreams"
          :key="dream.id"
          :dream="dream"
          :show-image="showImages"
          :show-actions="showCardActions"
          :show-stats="showStats"
          :show-meta="showMeta"
          :open-tab="openTab"
          @opened="openDream"
          @editing="editDream"
        />
      </div>

      <div
        v-else-if="!filteredDreams.length"
        class="flex min-h-96 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-100 p-8 text-center text-base-content/55"
      >
        <Icon name="kind-icon:ghost" class="h-16 w-16 text-primary/60" />
        <div>
          <p class="text-xl font-black">No Dreams found.</p>
          <p class="mt-1 text-sm">Create one in Dreammaker or loosen the filters.</p>
        </div>
        <button type="button" class="btn btn-primary rounded-2xl text-white" @click="startNewDream">
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Make a Dream
        </button>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'

const props = withDefaults(
  defineProps<{
    showHeader?: boolean
    showControls?: boolean
    showImages?: boolean
    showCardActions?: boolean
    showStats?: boolean
    showMeta?: boolean
    variant?: 'dashboard' | 'compact' | 'dropdown'
    openTab?: string
  }>(),
  {
    showHeader: true,
    showControls: true,
    showImages: true,
    showCardActions: true,
    showStats: true,
    showMeta: true,
    variant: 'dashboard',
    openTab: 'dreams',
  },
)

const emit = defineEmits<{
  (event: 'selected', dream: DreamWithRelations): void
  (event: 'opened', dream: DreamWithRelations): void
  (event: 'editing', dream: DreamWithRelations): void
  (event: 'created'): void
}>()

const dreamStore = useDreamStore()
const navStore = useNavStore()

const search = ref('')
const showMine = ref(false)
const showInactive = ref(false)
const dreamTypeFilter = ref('')
const displayMode = ref<'cards' | 'dropdown'>(
  props.variant === 'dropdown' ? 'dropdown' : 'cards',
)

const selectedDreamId = computed(() => dreamStore.selectedDream?.id ?? '')

const dreamSource = computed(() => {
  return showInactive.value ? dreamStore.dreams : dreamStore.visibleDreams
})

const filteredDreams = computed(() => {
  const term = search.value.trim().toLowerCase()

  return dreamSource.value.filter((dream: DreamWithRelations) => {
    if (showMine.value && dream.userId !== dreamStore.currentUserId) return false
    if (dreamTypeFilter.value && dream.dreamType !== dreamTypeFilter.value) return false

    if (!term) return true

    const haystack = [
      dream.title,
      dream.pitch,
      dream.description,
      dream.flavorText,
      dream.artPrompt,
      dream.examples,
      dream.designer,
      dream.dreamType,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(term)
  })
})

onMounted(async () => {
  await dreamStore.initialize()
})

function dreamTypeLabel(type?: string | null) {
  return String(type || 'PITCH')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

async function refresh() {
  await dreamStore.fetchDreams({ showInactive: showInactive.value })
}

function startNewDream() {
  dreamStore.startAddingDream()
  navStore.setDashboardTab?.('dream', 'dreammaker')
  emit('created')
}

async function selectFromDropdown(event: Event) {
  const id = Number((event.target as HTMLSelectElement).value)
  if (!Number.isInteger(id) || id <= 0) return

  const dream = await dreamStore.selectDreamById(id)
  if (dream) emit('selected', dream)
}

function openDream(dream: DreamWithRelations) {
  navStore.setDashboardTab?.('dream', props.openTab)
  emit('opened', dream)
}

function editDream(dream: DreamWithRelations) {
  navStore.setDashboardTab?.('dream', 'dreammaker')
  emit('editing', dream)
}
</script>
