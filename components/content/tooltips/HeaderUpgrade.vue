<template>
  <div class="relative">
    <!-- Header with slim design and internal toggle button -->
    <header
      ref="headerRef"
      class="flex items-center justify-between overflow-x-visible max-w-full px-2 py-1"
      :class="{ 'flex-col': isMobile }"
    >
      <!-- Toggle Button integrated within the header -->
      <button class="flex justify-self-end" @click="toggleSidebarFunction">
        <icon
          :name="toggleSidebar ? 'fxemoji:eye' : 'nimbus:eye-off'"
          class="text-lg flex items-right"
        />
      </button>
      <!-- Left Section -->
      <div class="flex items-center space-x-2">
        <avatar-image
          v-show="toggleSidebar"
          :size="avatarSize"
          alt="User Avatar"
        />
        <room-title class="text-sm font-semibold bg-base-200 rounded-2xl" />
        <h2 v-show="toggleSidebar" class="text-xs text-gray-500 italic pl-2">
          {{ pageSubtitle }}
        </h2>
      </div>

      <!-- Center Section -->
      <smart-links v-show="toggleSidebar" class="flex-1 text-center text-sm" />

      <!-- Right Section -->
      <div v-show="toggleSidebar" class="flex items-center gap-2">
        <butterfly-toggle class="text-sm hidden sm:block" />
        <theme-toggle class="text-sm hidden sm:block" />
        <login-button />
        <nav-toggle class="text-sm" @click="toggleNav" />
        <jellybean-count class="flex-2" />
      </div>
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
const avatarSize = ref('small')
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
.avatar-image {
  perspective: 1000px;
  width: auto;
  max-width: 200px;
}

header {
  overflow-x: hidden;
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
