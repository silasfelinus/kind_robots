<!-- /components/content/lab/wonderlab.vue -->
<template>
  <div
    class="relative grid grid-rows-[auto_1fr] h-full w-full bg-base-100 text-base-content"
  >
    <!-- Welcome Block (Only shown when not collapsed and no component is selected) -->
    <transition name="welcome-zoom">
      <div
        v-if="!introCollapsed && !componentStore.selectedComponent"
        class="z-10 px-4 pt-6 pb-4 flex justify-center"
      >
        <smart-container name="✨ Welcome to the WonderLab">
          <div class="text-base-content text-sm sm:text-md">
            Where components come alive—and sometimes crash gloriously.
          </div>
          <div
            class="flex flex-col items-center bg-base-100 border border-dashed border-accent p-4 rounded-xl w-full max-w-md"
          >
            <p class="font-mono text-base sm:text-lg text-accent mb-1">
              🗃️ Total Components in Database:
            </p>
            <p class="text-4xl sm:text-5xl font-bold text-secondary font-mono">
              {{ componentCount }}
            </p>
            <component-sync v-if="isAdmin" class="mt-4" />
          </div>
        </smart-container>
      </div>
    </transition>

    <!-- Collapsed Bubble Icon -->
    <transition name="bubble-zoom">
      <button
        v-if="introCollapsed && !componentStore.selectedComponent"
        class="fixed top-4 right-4 z-50 btn btn-sm btn-circle btn-accent shadow-lg"
        @click="restoreIntro"
        title="Show Welcome"
      >
        <Icon name="kind-icon:sparkles" class="text-xl" />
      </button>
    </transition>

    <!-- Main Scrollable Gallery Area -->
    <div
      v-if="!componentStore.selectedComponent"
      class="flex-1 overflow-y-auto px-4 py-6 max-w-7xl w-full mx-auto"
    >
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <Icon name="kind-icon:bubble-loading" class="animate-spin text-4xl" />
        <span class="ml-2">Loading components…</span>
      </div>

      <div v-if="errorMessages.length" class="text-error text-center">
        🚨 {{ errorMessages.join(', ') }}
      </div>

      <lab-gallery />
    </div>

    <!-- Fullscreen Component View -->
    <div
      v-if="componentStore.selectedComponent"
      class="px-4 py-6 w-full max-w-7xl mx-auto"
    >
      <select-component />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import { useUserStore } from '@/stores/userStore'

const isLoading = ref(true)
const errorMessages = ref<string[]>([])
const introCollapsed = ref(false)

const componentStore = useComponentStore()
const userStore = useUserStore()

const componentCount = computed(() => componentStore.allComponents.length)
const isAdmin = computed(() => userStore.isAdmin)

const restoreIntro = () => {
  introCollapsed.value = false
  localStorage.setItem('wonderlab_intro_seen', 'false')
}

const handleScroll = () => {
  if (!introCollapsed.value && window.scrollY > 80) {
    introCollapsed.value = true
    localStorage.setItem('wonderlab_intro_seen', 'true')
    window.removeEventListener('scroll', handleScroll)
  }
}

onMounted(async () => {
  isLoading.value = true

  const seen = localStorage.getItem('wonderlab_intro_seen') === 'true'
  introCollapsed.value = seen

  if (!seen) {
    window.addEventListener('scroll', handleScroll, { passive: true })
  }

  try {
    await componentStore.initialize()
  } catch (error) {
    errorMessages.value.push('Failed to initialize components')
    console.error('Error during initialization:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
/* Welcome shrink animation */
.welcome-zoom-enter-active,
.welcome-zoom-leave-active {
  transition: all 0.5s ease;
  transform-origin: top right;
}
.welcome-zoom-enter-from,
.welcome-zoom-leave-to {
  opacity: 0;
  transform: scale(0.2) translate(50%, -50%);
  border-radius: 9999px;
}

/* Bubble icon zoom */
.bubble-zoom-enter-active,
.bubble-zoom-leave-active {
  transition: all 0.4s ease;
  transform-origin: top right;
}
.bubble-zoom-enter-from,
.bubble-zoom-leave-to {
  opacity: 0;
  transform: scale(0.2) translate(50%, -50%);
}
</style>
