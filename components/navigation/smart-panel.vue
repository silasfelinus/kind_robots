<!-- /components/content/icons/nav-panel.vue -->
<template>
  <div class="h-full px-4 py-5 sm:px-6 sm:py-7">
    <!-- Header row with history controls -->
    <div class="flex items-center justify-between gap-2 mb-3">
      <h2 class="text-lg sm:text-xl font-bold text-base-content">
        Browse Rooms and Tools
      </h2>

      <div class="flex items-center gap-1">
        <button
          v-if="canGoBack"
          type="button"
          class="btn btn-ghost btn-xs sm:btn-xs rounded-full border border-base-300 px-3 py-1 flex items-center gap-1"
          @click="goBack"
        >
          <Icon name="kind-icon:arrow-left" class="w-3 h-3" />
          <span>Back</span>
        </button>

        <button
          v-if="canGoForward"
          type="button"
          class="btn btn-ghost btn-xs sm:btn-xs rounded-full border border-base-300 px-3 py-1 flex items-center gap-1"
          @click="goNext"
        >
          <span>Next</span>
          <Icon name="kind-icon:arrow-right" class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="!navInitialized"
      class="w-full flex items-center justify-center py-8 text-sm text-base-content/70"
    >
      Loading navigation...
    </div>

    <!-- Main nav content -->
    <div
      v-else
      class="w-full flex flex-col items-stretch rounded-2xl p-2 gap-4"
    >
      <!-- Filter chips row -->
      <div
        class="flex flex-wrap items-center justify-center gap-2 px-1 sm:px-2"
      >
        <button
          v-for="chip in filters"
          :key="chip.value"
          class="btn btn-xs sm:btn-sm rounded-full px-3"
          :class="filterClass(chip.value)"
          @click="setFilter(chip.value)"
        >
          {{ chip.label }}
        </button>
      </div>

      <!-- Grid of icons for the current filter -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        <smart-card
          v-for="(icon, i) in filteredIcons"
          :key="icon.link || icon.title || i"
          :icon="icon"
          :delay="i"
        />
      </div>

      <p
        v-if="filteredIcons.length === 0"
        class="text-center text-xs sm:text-sm text-base-content/70 mt-1"
      >
        No links for this selection yet.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/nav-panel.vue
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Icon } from '#components'
import { useNavStore } from '@/stores/navStore'

const navStore = useNavStore()
const router = useRouter()

const {
  activeModelType,
  directoryIcons,
  modelTypes,
  favoritesIcons,
  canGoBack,
  canGoForward,
  backPath,
  forwardPath,
} = storeToRefs(navStore)

const navInitialized = computed(() => navStore.isInitialized)

// All icons coming from the store
const allIcons = computed(() => directoryIcons.value)

// Do we actually have any favorites
const hasFavorites = computed(() => favoritesIcons.value.length > 0)

// Do we have Ami / User icons
const hasAmiIcons = computed(() =>
  allIcons.value.some((icon) => icon.category === 'ami'),
)
const hasUserIcons = computed(() =>
  allIcons.value.some((icon) => icon.category === 'user'),
)

// Local filter state: 'all', 'favorites', or a modelType/category
const STORAGE_KEY = 'kind-nav-active-filter'
const activeFilter = ref<string>('all')

// Hydrate filter from localStorage or activeModelType
onMounted(() => {
  if (process.client) {
    const saved = window.localStorage.getItem(STORAGE_KEY)

    if (saved) {
      activeFilter.value = saved
      // Sync store for modelType filters
      if (
        saved === 'all' ||
        saved === 'favorites' ||
        saved === 'ami' ||
        saved === 'user'
      ) {
        navStore.setActiveModelType(null)
      } else {
        navStore.setActiveModelType(saved)
      }
    } else if (activeModelType.value) {
      activeFilter.value = activeModelType.value
    }
  }
})

// Persist filter choice
watch(
  activeFilter,
  (val) => {
    if (process.client) {
      window.localStorage.setItem(STORAGE_KEY, val)
    }
  },
  { immediate: false },
)

// Build filter chips dynamically
const filters = computed(() => {
  const chips: { value: string; label: string }[] = []

  if (hasFavorites.value) {
    chips.push({ value: 'favorites', label: 'Favorites' })
  }

  chips.push({ value: 'all', label: 'All' })

  modelTypes.value.forEach((type) => {
    chips.push({ value: type, label: formatModelType(type) })
  })

  if (hasAmiIcons.value) {
    chips.push({ value: 'ami', label: 'Ami' })
  }
  if (hasUserIcons.value) {
    chips.push({ value: 'user', label: 'User' })
  }

  return chips
})

const filteredIcons = computed(() => {
  const icons = allIcons.value
  const filter = activeFilter.value

  if (filter === 'all') {
    return icons
  }

  if (filter === 'favorites') {
    return icons.filter((icon) => icon.link && navStore.isFavorite(icon.link))
  }

  if (filter === 'ami' || filter === 'user') {
    return icons.filter((icon) => icon.category === filter)
  }

  // Treat everything else as a modelType filter
  return icons.filter((icon) => icon.modelType === filter)
})

// Keep store in sync with modelType filters only
function setFilter(value: string) {
  activeFilter.value = value

  if (value === 'all' || value === 'favorites') {
    navStore.setActiveModelType(null)
  } else if (value === 'ami' || value === 'user') {
    // Categories are not modelTypes, so do not push them into the store
    navStore.setActiveModelType(null)
  } else {
    navStore.setActiveModelType(value)
  }
}

function filterClass(value: string) {
  return activeFilter.value === value
    ? 'btn-primary'
    : 'btn-ghost border border-base-300'
}

function formatModelType(type: string) {
  if (!type) return ''
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// History navigation
function goBack() {
  if (backPath.value) {
    router.push(backPath.value)
  }
}

function goNext() {
  if (forwardPath.value) {
    router.push(forwardPath.value)
  }
}
</script>
