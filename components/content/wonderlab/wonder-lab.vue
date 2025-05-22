<template>
  <div
    class="relative grid grid-rows-[auto_1fr] min-h-[100dvh] bg-base-100 text-base-content overflow-hidden"
  >
    <!-- Welcome Block (Only shown when not collapsed and no component is selected) -->
    <transition name="welcome-zoom">
      <div
        v-if="!introCollapsed && !componentStore.selectedComponent"
        class="z-10 px-4 pt-6 pb-4 flex justify-center"
      >
        <div
          class="welcome-card bg-base-200 border border-base-300 rounded-2xl px-6 py-5 text-center shadow-md flex flex-col items-center gap-4 w-full max-w-4xl"
        >
          <div
            class="text-xl sm:text-2xl font-bold tracking-tight text-primary-content"
          >
            ✨ Welcome to the WonderLab
          </div>
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
        </div>
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
      class="overflow-y-auto px-4 py-6 max-w-7xl w-full mx-auto"
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

    <!-- Fullscreen Component View (In-content fullscreen, not viewport-absolute) -->
<div class="relative z-30 w-full max-w-7xl mx-auto px-4 py-6">
  <button
    class="btn btn-primary mb-4"
    @click="handleBack"
  >
    <Icon name="kind-icon:arrow-left" class="mr-2" />
    Back
  </button>

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

const handleBack = () => {
  componentStore.clearSelectedComponent()
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

/* Main content slide up */
.main-slide-enter-active,
.main-slide-leave-active {
  transition: all 0.4s ease;
}
.main-slide-enter-from {
  opacity: 0;
  transform: translateY(24px);
}
.main-slide-leave-to {
  opacity: 0;
  transform: translateY(-24px);
}
</style>
