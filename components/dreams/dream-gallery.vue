<!-- /components/dreams/dream-gallery.vue -->
<template>
  <section
    class="flex min-h-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
  >
    <header
      v-if="showHeader"
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p class="text-xs font-bold uppercase tracking-wide text-primary">
          Dream Atlas
        </p>
        <h2 class="text-2xl font-black text-base-content">Location Gallery</h2>
        <p class="text-sm text-base-content/70">
          Choose the place before choosing the trouble.
        </p>
      </div>

      <button
        class="btn btn-primary rounded-2xl"
        type="button"
        @click="startNewDream"
      >
        <Icon name="kind-icon:plus" class="h-5 w-5" />
        New Dream
      </button>
    </header>

    <div
      v-if="showControls"
      class="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
    >
      <label class="input input-bordered flex items-center gap-2 rounded-2xl">
        <Icon name="kind-icon:search" class="h-5 w-5 opacity-60" />
        <input
          v-model="search"
          class="grow"
          type="search"
          placeholder="Search locations"
          @keyup.enter="refresh"
        />
      </label>

      <button
        class="btn rounded-2xl"
        :class="showMine ? 'btn-primary' : 'btn-ghost'"
        type="button"
        @click="toggleMine"
      >
        Mine
      </button>

      <button
        class="btn rounded-2xl"
        :class="showInactive ? 'btn-warning' : 'btn-ghost'"
        type="button"
        @click="toggleInactive"
      >
        Archived
      </button>

      <button
        class="btn btn-secondary rounded-2xl"
        type="button"
        :disabled="dreamStore.loading"
        @click="refresh"
      >
        <Icon name="kind-icon:refresh" class="h-5 w-5" />
        Refresh
      </button>
    </div>

    <select
      v-if="variant === 'dropdown'"
      class="select select-bordered rounded-2xl"
      :value="dreamStore.selectedDream?.id ?? ''"
      @change="selectFromDropdown"
    >
      <option value="">Select a Dream location</option>
      <option v-for="dream in filteredDreams" :key="dream.id" :value="dream.id">
        {{ dream.title }} · {{ dream.isPublic ? 'public' : 'private' }}
      </option>
    </select>

    <div
      v-if="dreamStore.selectedDream && variant === 'dropdown'"
      class="rounded-2xl border border-primary/30 bg-primary/10 p-3"
    >
      <p class="font-black text-primary">
        {{ dreamStore.selectedDream.title }}
      </p>
      <p class="line-clamp-2 text-sm text-base-content/70">
        {{ dreamStore.selectedDream.currentVibe }}
      </p>
    </div>

    <div
      v-if="variant !== 'dropdown'"
      class="grid min-h-0 gap-3 overflow-y-auto pr-1"
      :class="
        compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
      "
    >
      <dream-card
        v-for="dream in filteredDreams"
        :key="dream.id"
        :dream="dream"
        :show-stats="showStats"
        :show-actions="showCardActions"
        @edit="emit('edit', $event)"
      />
    </div>

    <div
      v-if="!dreamStore.loading && !filteredDreams.length"
      class="rounded-2xl border border-dashed border-base-300 p-4 text-center text-sm text-base-content/60"
    >
      No Dream locations found. The atlas is blank. Dramatic, but unhelpful.
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'

const props = withDefaults(
  defineProps<{
    variant?: 'dashboard' | 'dropdown'
    showHeader?: boolean
    showControls?: boolean
    showImages?: boolean
    showCardActions?: boolean
    showOpenButton?: boolean
    showStats?: boolean
    showMeta?: boolean
    compact?: boolean
  }>(),
  {
    variant: 'dashboard',
    showHeader: true,
    showControls: true,
    showImages: true,
    showCardActions: true,
    showOpenButton: true,
    showStats: true,
    showMeta: true,
    compact: false,
  },
)

const emit = defineEmits<{
  edit: [id: number]
}>()

const dreamStore = useDreamStore()

const search = ref('')
const showMine = ref(false)
const showInactive = ref(false)

const filteredDreams = computed(() => {
  const term = search.value.trim().toLowerCase()
  const source = showInactive.value
    ? dreamStore.dreams
    : dreamStore.activeDreams

  return source.filter((dream) => {
    const ownershipMatch =
      !showMine.value || dream.userId === dreamStore.currentUserId
    const searchMatch =
      !term ||
      dream.title.toLowerCase().includes(term) ||
      dream.description?.toLowerCase().includes(term) ||
      dream.currentVibe?.toLowerCase().includes(term) ||
      dream.currentPrompt?.toLowerCase().includes(term)

    return ownershipMatch && searchMatch
  })
})

onMounted(async () => {
  await dreamStore.initialize()
})

function startNewDream() {
  dreamStore.startAddingDream()
}

function toggleMine() {
  showMine.value = !showMine.value
  refresh()
}

function toggleInactive() {
  showInactive.value = !showInactive.value
  refresh()
}

async function refresh() {
  await dreamStore.fetchDreams({
    userOnly: showMine.value,
    showInactive: showInactive.value,
    search: search.value,
  })
}

async function selectFromDropdown(event: Event) {
  const target = event.target as HTMLSelectElement
  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    dreamStore.deselectDream()
    return
  }

  await dreamStore.selectDreamById(id)
}
</script>
