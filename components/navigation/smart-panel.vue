<!-- /components/content/icons/smart-panel.vue -->
<template>
  <div class="w-full flex flex-col">
    <div class="flex items-center justify-center mb-3"></div>

    <div
      v-if="!navInitialized"
      class="w-full flex items-center justify-center py-8 text-sm text-base-content/70"
    >
      Loading navigation...
    </div>

    <div
      v-else
      class="relative w-full flex-1 min-h-0 flex flex-col items-stretch rounded-2xl border border-base-200 bg-base-100/80 p-3 sm:p-4 gap-4 overflow-hidden"
    >
      <div v-if="pageImagePath" class="w-full flex justify-center">
        <div
          class="inline-flex items-center justify-center px-3 py-1.5 rounded-2xl border border-base-200 bg-base-100 text-xs sm:text-sm text-base-content/80 max-w-full truncate"
        >
          <img
            :src="pageImagePath"
            alt="Room Background"
            class="w-24 h-24 rounded-full"
          />
        </div>
      </div>

      <div v-if="pageIcon" class="pointer-events-none absolute inset-0">
        <Icon
          :name="pageIcon"
          class="absolute -top-6 -left-6 sm:-top-8 sm:-left-8 lg:-top-10 lg:-left-10 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 text-primary/40"
          style="transform: rotate(6deg) scaleX(-1)"
        />
        <Icon
          :name="pageIcon"
          class="absolute -top-6 -right-6 sm:-top-8 sm:-right-8 lg:-top-10 lg:-right-10 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 text-primary/40"
          style="transform: rotate(6deg)"
        />
        <Icon
          :name="pageIcon"
          class="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 lg:-bottom-10 lg:-right-10 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 text-primary/40"
          style="transform: rotate(6deg) scaleY(-1)"
        />
        <Icon
          :name="pageIcon"
          class="absolute -bottom-6 -left-6 sm:-bottom-8 sm:-left-8 lg:-bottom-10 lg:-left-10 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 text-primary/40"
          style="transform: rotate(6deg) scaleX(-1) scaleY(-1)"
        />
      </div>

      <div class="flex items-center justify-between gap-2 px-1 sm:px-2">
        <button
          v-if="canGoBack"
          type="button"
          class="btn btn-ghost btn-xs sm:btn-xs rounded-full border border-base-200 bg-base-100 px-3 py-1 flex items-center gap-1"
          @click="goBack"
        >
          <Icon name="kind-icon:arrow-left" class="w-3 h-3" />
          <span>Back</span>
        </button>

        <div class="flex-1" />

        <button
          v-if="canGoForward"
          type="button"
          class="btn btn-ghost btn-xs sm:btn-xs rounded-full border border-base-200 bg-base-100 px-3 py-1 flex items-center gap-1"
          @click="goNext"
        >
          <span>Next</span>
          <Icon name="kind-icon:arrow-right" class="w-3 h-3" />
        </button>
      </div>

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
// /components/content/icons/smart-panel.vue
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Icon } from '#components'
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'

const navStore = useNavStore()
const pageStore = usePageStore()
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

const pageImagePath = computed(() => {
  const img = pageStore.page?.image
  if (!img) return '/images/bot.webp'

  if (img.startsWith('/images/')) return img
  if (img.startsWith('images/')) return `/${img}`
  if (img.startsWith('/')) return `/images/${img.slice(1)}`
  return `/images/${img}`
})

const pageIcon = computed(() => pageStore.page?.icon || '')

const allIcons = computed(() => directoryIcons.value)

const hasFavorites = computed(() => favoritesIcons.value.length > 0)

const hasAmiIcons = computed(() =>
  allIcons.value.some((icon) => icon.category === 'ami'),
)
const hasUserIcons = computed(() =>
  allIcons.value.some((icon) => icon.category === 'user'),
)

const STORAGE_KEY = 'kind-nav-active-filter'
const activeFilter = ref<string>('all')

onMounted(() => {
  if (process.client) {
    const saved = window.localStorage.getItem(STORAGE_KEY)

    if (saved) {
      activeFilter.value = saved
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

watch(
  activeFilter,
  (val) => {
    if (process.client) {
      window.localStorage.setItem(STORAGE_KEY, val)
    }
  },
  { immediate: false },
)

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

  if (filter === 'all') return icons

  if (filter === 'favorites') {
    return icons.filter((icon) => icon.link && navStore.isFavorite(icon.link))
  }

  if (filter === 'ami' || filter === 'user') {
    return icons.filter((icon) => icon.category === filter)
  }

  return icons.filter((icon) => icon.modelType === filter)
})

function setFilter(value: string) {
  activeFilter.value = value

  if (value === 'all' || value === 'favorites') {
    navStore.setActiveModelType(null)
  } else if (value === 'ami' || value === 'user') {
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
