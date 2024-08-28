<template>
  <div class="relative">
    <!-- Header with slim design and internal toggle button -->
    <header
      ref="headerRef"
      class="flex items-center justify-between px-2 py-1"
      :class="{ 'flex-col': isMobile }"
    >
      <!-- Main Section visible based on toggleSidebar state -->
      <div
        v-show="!toggleSidebar"
        class="flex items-center justify-start space-x-2 flex-grow"
      >
        <avatar-image class="h-8 w-8" alt="User Avatar" />
        <room-title class="text-sm font-semibold bg-base-200 rounded-2xl" />
      </div>
      <div
        v-show="toggleSidebar"
        class="flex items-center justify-start space-x-2 flex-grow"
      >
        <avatar-image class="h-16 w-16" alt="User Avatar" />
        <div class="flex-col">
          <room-title
            class="flex text-sm font-semibold bg-primary rounded-2xl p-1"
          />
          <h2 class="flex text-xs text-gray-500 italic">
            {{ pageSubtitle }}
          </h2>
        </div>
        <smart-links class="flex" />
        <butterfly-toggle class="flex text-sm sm:block" />
        <theme-toggle class="flex text-sm sm:block" />
        <login-button class="flex" />
        <nav-toggle class="flex text-md" @click="toggleNav" />
        <jellybean-count class="flex" />
      </div>

      <!-- Toggle Button integrated within the header -->
      <button class="ml-auto p-2" @click="toggleSidebarFunction">
        <icon
          :name="toggleSidebar ? 'fxemoji:eye' : 'nimbus:eye-off'"
          class="text-lg text-accent"
        />
      </button>
    </header>

    <!-- Navigation -->
    <navigation-trimmed
      v-if="showNav"
      class="absolute bottom-0 w-full bg-secondary shadow-lg transition-transform duration-300 z-20"
      :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useContentStore } from './../../../stores/contentStore'
import { ErrorType } from './../../../stores/errorStore'

const { page } = useContentStore()

const pageSubtitle = computed(() => page?.subtitle || 'the kindest')
const showNav = ref(false)
const isMobile = ref(false)
const headerRef = ref<HTMLElement | null>(null)
const errorStore = useErrorStore()
const toggleSidebar = ref(true)

const toggleSidebarFunction = () => {
  toggleSidebar.value = !toggleSidebar.value
  console.log('Toggle Sidebar:', toggleSidebar.value) // Debug: Check the state change
}

function handleResize() {
  isMobile.value = window.innerWidth < 768
  if (!headerRef.value) {
    errorStore.setError(
      ErrorType.GENERAL_ERROR,
      'Header reference is not available.',
    )
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
header {
  max-width: 100vw;
}

.navigation-trimmed {
  position: absolute;
  width: 100%;
  transition: transform 0.3s ease-in-out;
}

@media (max-width: 768px) {
  header {
    flex-direction: column;
    padding: 0.5rem;
  }
}
</style>
