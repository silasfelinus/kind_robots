<!-- /components/content/story/lab-nav.vue -->
<template>
  <div class="w-full flex flex-col items-center">
    <div
      class="flex justify-center flex-wrap gap-2 md:gap-3 lg:gap-4 w-full mb-3"
    >
      <button
        v-for="tab in visibleTabs"
        :key="tab.name"
        class="flex-1 min-w-[45%] max-w-[30%] md:min-w-[25%] lg:min-w-[15%] px-3 py-2 text-sm md:text-md lg:text-lg font-semibold border border-accent rounded-lg transition-all duration-300 text-center"
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
import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { useDisplayStore } from '~/stores/displayStore'

const userStore = useUserStore()
const displayStore = useDisplayStore()

const tabs = [
  { name: 'LazyWonderLab', label: 'Wonder Lab' },
  { name: 'LazyAnimationTester', label: 'Animation Tester' },
  { name: 'LazyStoreTester', label: 'Store Tester', requiresAdmin: true },
  { name: 'LazyRebelButton', label: 'Rebel Button' },
  { name: 'LazyAboutPage', label: 'About Page' },
  { name: 'LazySponsorPage', label: 'Sponsor Page' },
]

const visibleTabs = computed(() =>
  tabs.filter((tab) => !tab.requiresAdmin || userStore.isAdmin)
)

const activeTab = ref(visibleTabs.value[0]?.name || 'LazyWonderLab')

const selectTab = (tabName: string) => {
  activeTab.value = tabName
  displayStore.setMainComponent(tabName)
}
</script>
