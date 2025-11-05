<!-- /components/content/layout/smart-grid.vue -->
<template>
  <div class="w-full flex flex-col items-stretch rounded-2xl p-2 gap-4">
    <!-- Filter chips row -->
    <div class="flex flex-wrap items-center justify-center gap-2 px-1 sm:px-2">
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

    <!-- AMI chat always visible -->
    <div class="mt-3 w-full">
      <transition name="fade">
        <ami-chat v-if="showChat" class="w-full" />
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/layout/smart-grid.vue
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useNavStore } from '@/stores/navStore'
import type { SmartIcon } from '@/stores/smartbarStore'

const navStore = useNavStore()
const { activeModelType, directoryIcons, modelTypes, favoritesIcons } =
  storeToRefs(navStore)

const allIcons = computed(() => directoryIcons.value)

// Do we actually have any favorites?
const hasFavorites = computed(() => favoritesIcons.value.length > 0)

// Do we have Ami / User icons?
const hasAmiIcons = computed(() =>
  allIcons.value.some((icon) => icon.category === 'ami'),
)
const hasUserIcons = computed(() =>
  allIcons.value.some((icon) => icon.category === 'user'),
)

// Local filter state: 'all', 'favorites', or a modelType/category
const activeFilter = ref<string>('all')

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

const showChat = ref(true)

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
</script>

<style scoped>
/* Simple fade for the AMI chat block */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 150ms ease-out,
    transform 150ms ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
