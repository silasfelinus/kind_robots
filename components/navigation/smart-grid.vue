<!-- /components/content/layout/smart-grid.vue -->
<template>
  <div class="w-full flex flex-col items-stretch rounded-2xl p-2 gap-4">
    <!-- Tabs -->
    <div class="flex justify-center gap-2">
      <button
        class="btn btn-xs sm:btn-sm rounded-full px-3"
        :class="tabClass('favorites')"
        @click="setTab('favorites')"
      >
        Favorites
      </button>
      <button
        class="btn btn-xs sm:btn-sm rounded-full px-3"
        :class="tabClass('navigation')"
        @click="setTab('navigation')"
      >
        Navigation
      </button>
      <button
        class="btn btn-xs sm:btn-sm rounded-full px-3"
        :class="tabClass('all')"
        @click="setTab('all')"
      >
        All
      </button>
    </div>

    <!-- Navigation: modelType selector + grid -->
    <div v-if="activeTab === 'navigation'" class="flex flex-col gap-3">
      <!-- Model type row -->
      <div
        class="flex flex-wrap items-center justify-center gap-2 px-1 sm:px-2"
      >
        <button
          v-for="type in modelTypes"
          :key="type"
          class="btn btn-xs sm:btn-sm rounded-full px-3"
          :class="
            activeModelType === type
              ? 'btn-primary'
              : 'btn-ghost border border-base-300'
          "
          @click="setModelType(type)"
        >
          {{ formatModelType(type) }}
        </button>

        <!-- Optional: show ami / user catchall -->
        <button
          v-if="hasAmiIcons"
          class="btn btn-xs sm:btn-sm rounded-full px-3"
          :class="
            activeModelType === 'ami'
              ? 'btn-primary'
              : 'btn-ghost border border-base-300'
          "
          @click="setModelType('ami')"
        >
          Ami
        </button>
        <button
          v-if="hasUserIcons"
          class="btn btn-xs sm:btn-sm rounded-full px-3"
          :class="
            activeModelType === 'user'
              ? 'btn-primary'
              : 'btn-ghost border border-base-300'
          "
          @click="setModelType('user')"
        >
          User
        </button>
      </div>

      <!-- Grid for current modelType -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        <nav-card
          v-for="(icon, i) in navigationIcons"
          :key="icon.link || icon.title || i"
          :title="icon.label || icon.title"
          :icon="icon.icon || 'fa-solid:circle-question'"
          :description="icon.description || ''"
          :tooltip="icon.description || ''"
          :to="icon.link || undefined"
          :delay="i"
          :is-favorite="isFavorite(icon)"
          :on-toggle-favorite="() => toggleFavorite(icon)"
        />
      </div>

      <p
        v-if="navigationIcons.length === 0"
        class="text-center text-xs sm:text-sm text-base-content/70 mt-1"
      >
        No links yet for this category.
      </p>
    </div>

    <!-- Favorites tab -->
    <div v-else-if="activeTab === 'favorites'" class="flex flex-col gap-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        <nav-card
          v-for="(icon, i) in favoritesIcons"
          :key="icon.link || icon.title || i"
          :title="icon.label || icon.title"
          :icon="icon.icon || 'fa-solid:circle-question'"
          :description="icon.description || ''"
          :tooltip="icon.description || ''"
          :to="icon.link || undefined"
          :delay="i"
          :is-favorite="true"
          :on-toggle-favorite="() => toggleFavorite(icon)"
        />
      </div>

      <p
        v-if="favoritesIcons.length === 0"
        class="text-center text-xs sm:text-sm text-base-content/70 mt-1"
      >
        No favorites yet. Tap the star on any card to pin it here.
      </p>
    </div>

    <!-- All tab -->
    <div v-else class="flex flex-col gap-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        <nav-card
          v-for="(icon, i) in allIcons"
          :key="icon.link || icon.title || i"
          :title="icon.label || icon.title"
          :icon="icon.icon || 'fa-solid:circle-question'"
          :description="icon.description || ''"
          :tooltip="icon.description || ''"
          :to="icon.link || undefined"
          :delay="i"
          :is-favorite="isFavorite(icon)"
          :on-toggle-favorite="() => toggleFavorite(icon)"
        />
      </div>
    </div>

    <!-- AMI chat toggle button + embedded chat -->
    <div class="mt-2 flex flex-col items-center gap-2">
      <button
        class="btn btn-sm rounded-full px-4 flex items-center gap-2"
        @click="showChat = !showChat"
      >
        <Icon name="kind-icon:alien" class="w-4 h-4" />
        <span>{{ showChat ? 'Hide AMI chat' : 'Chat with AMI' }}</span>
      </button>

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
import { Icon } from '#components' // Nuxt auto-import, adjust if needed
import { useNavStore, type NavTab } from '@/stores/navStore'
import { type SmartIcon } from '@/stores/smartbarStore'

const navStore = useNavStore()
const {
  activeTab,
  activeModelType,
  directoryIcons,
  modelTypes,
  favoritesIcons,
} = storeToRefs(navStore)

const allIcons = computed(() => directoryIcons.value)

const navigationIcons = computed(() => {
  // Navigation tab with modelType selection
  if (!activeModelType.value) {
    return allIcons.value
  }

  // Model types: use modelType; Ami/User: use category
  if (activeModelType.value === 'ami' || activeModelType.value === 'user') {
    return allIcons.value.filter(
      (icon) => icon.category === activeModelType.value,
    )
  }

  return allIcons.value.filter(
    (icon) => icon.modelType === activeModelType.value,
  )
})

const hasAmiIcons = computed(() =>
  allIcons.value.some((icon) => icon.category === 'ami'),
)
const hasUserIcons = computed(() =>
  allIcons.value.some((icon) => icon.category === 'user'),
)

const showChat = ref(false)

function setTab(tab: NavTab) {
  navStore.setActiveTab(tab)
}

function setModelType(type: string) {
  navStore.setActiveModelType(type)
}

function tabClass(tab: NavTab) {
  return activeTab.value === tab
    ? 'btn-primary'
    : 'btn-ghost border border-base-300'
}

function formatModelType(type: string) {
  // Simple label formatter: "art" -> "Art", "adddominion" -> "Adddominion"
  if (!type) return ''
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function toggleFavorite(icon: SmartIcon) {
  navStore.toggleFavorite(icon.link)
}

function isFavorite(icon: SmartIcon) {
  return navStore.isFavorite(icon.link)
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
