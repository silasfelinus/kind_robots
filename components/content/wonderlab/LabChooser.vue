<template>
  <div
    class="button-container flex flex-col items-center overflow-hidden p-4"
    :style="mainContentStyle"
  >
    <!-- Section Buttons -->
    <div
      class="flex justify-center space-x-1 md:space-x-3 lg:space-x-5 w-full mb-3"
    >
      <button
        v-for="tab in visibleTabs"
        :key="tab.name"
        :class="[
          'px-2 md:px-4 lg:px-6 text-lg font-semibold border-accent rounded-lg',
          tab.name === activeTab
            ? 'bg-primary text-white'
            : 'bg-accent hover:bg-secondary text-white',
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
