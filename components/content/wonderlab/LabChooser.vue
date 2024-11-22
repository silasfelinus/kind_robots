<template>
  <div
    class="button-container flex flex-col items-center overflow-hidden p-4"
    :style="mainContentStyle"
  >
    <div
      class="flex justify-center flex-wrap gap-2 md:gap-3 lg:gap-4 w-full mb-3"
    >
      <button
        v-for="tab in visibleTabs"
        :key="tab.name"
        class="flex-1 min-w-[45%] max-w-[30%] md:min-w-[25%] lg:min-w-[15%] px-3 py-2 text-sm md:text-md lg:text-lg font-semibold border border-accent rounded-lg transition-all duration-300"
        :class="[
          tab.name === activeTab
            ? 'bg-primary text-white'
            : 'bg-secondary hover:bg-accent text-white',
        ]"
        @click="activeTab = tab.name"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Components section with scrollable content -->
    <div class="flex-grow w-full overflow-y-auto h-full">
      <LazyWonderLab v-if="activeTab === 'wonder-lab'" />
      <LazyStoreTester v-if="activeTab === 'store-tester'" />
      <LazyAnimationTester v-if="activeTab === 'animation-tester'" />
      <lazy-rebel-button v-if="activeTab === 'rebel-button'" />
      <lazy-about-page v-if="activeTab === 'about-page'" />
      <lazy-sponsor-page v-if="activeTab === 'sponsor-page'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { useDisplayStore } from '~/stores/displayStore'

// Access the user and display stores
const userStore = useUserStore()
const displayStore = useDisplayStore()

// Ensure displayStore initializes and stays updated
onMounted(() => {
  displayStore.initialize()
})

// Define all tabs, including permissions
const tabs = [
  { name: 'wonder-lab', label: 'Wonder Lab' },
  { name: 'animation-tester', label: 'Animation Tester' },
  { name: 'store-tester', label: 'Store Tester', requiresAdmin: true },
  { name: 'rebel-button', label: 'Rebel Button' },
  { name: 'about-page', label: 'About Page' },
  { name: 'sponsor-page', label: 'Sponsor Page' },
]

// Filter tabs based on user role
const visibleTabs = computed(() =>
  tabs.filter((tab) => !tab.requiresAdmin || userStore.isAdmin),
)

// Default to the first visible tab
const activeTab = ref(visibleTabs.value[0]?.name || 'wonder-lab')

// Dynamically compute the main content area size
const mainContentStyle = computed(() => ({
  height: `calc(${displayStore.mainVh}vh)`,
  width: `calc(${displayStore.mainVw}vw)`,
}))
</script>
