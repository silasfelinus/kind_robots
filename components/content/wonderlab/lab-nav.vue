<!-- /components/content/story/lab-nav.vue -->

<template>
  <div class="w-full flex flex-col items-center">
    <div
      class="flex justify-center flex-wrap gap-2 md:gap-3 lg:gap-4 w-full mb-3 px-2"
    >
      <button
        v-for="tab in visibleTabs"
        :key="tab.name"
        class="px-4 py-2 text-sm md:text-base lg:text-lg font-semibold border border-accent rounded-2xl text-center whitespace-nowrap transition-all duration-300 w-auto max-w-full"
        :class="[
          tab.name === activeTab
            ? 'bg-primary text-black'
            : 'bg-secondary hover:bg-accent text-black',
        ]"
        @click="selectTab(tab.name)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '~/stores/userStore'
import { useDisplayStore } from '~/stores/displayStore'

const route = useRoute()
const userStore = useUserStore()
const displayStore = useDisplayStore()

const tabs = [
  { name: 'wonder-lab', label: 'Wonder Lab' },
  { name: 'animation-tester', label: 'Animation Tester' },
  { name: 'store-tester', label: 'Store Tester', requiresAdmin: true },
  { name: 'rebel-button', label: 'Rebel Button' },
  { name: 'about-page', label: 'About Page' },
  { name: 'sponsor-page', label: 'Sponsor Page' },
]

const visibleTabs = computed(() =>
  tabs.filter((tab) => !tab.requiresAdmin || userStore.isAdmin),
)

const activeTab = ref('')

const selectTab = (tabName: string) => {
  activeTab.value = tabName
  displayStore.setMainComponent(tabName)
}

// Reset tab on route change or initial load
watch(
  () => route.fullPath,
  () => {
    const defaultTab = visibleTabs.value[0]?.name || ''
    if (defaultTab) selectTab(defaultTab)
  },
  { immediate: true },
)
</script>
