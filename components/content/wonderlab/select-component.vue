<!-- /components/content/wonderlab/select-component.vue -->
<template>
  <div class="relative w-full min-h-[80vh]">

    <!-- Scrollable Component Container -->
    <div class="w-full h-full max-h-[calc(100dvh-6rem)] overflow-auto rounded-2xl border border-base-300 bg-base-100 shadow-md">
      <component
        :is="resolvedComponent"
        v-if="resolvedComponent"
        class="w-full h-full"
      />
    </div>

    <!-- Floating Back Button (top-left) -->
<button
  class="fixed left-6 z-60 btn btn-primary btn-sm px-4 py-2 shadow-lg"
  :style="{ top: backButtonTop }"
  @click="handleBack"
>
  <Icon name="kind-icon:arrow-left" class="mr-2" />
  Back
</button>

    <!-- Floating Reaction Button (bottom-left) -->
    <button
      class="fixed bottom-6 left-6 z-50 btn btn-accent btn-sm btn-circle"
      @click="showReactions = !showReactions"
      title="Toggle Reactions"
    >
      <Icon name="kind-icon:emoji" class="text-xl" />
    </button>

<transition name="slide-up-down">
  <div
    v-if="showReactions && componentStore.selectedComponent"
    class="fixed bottom-0 left-0 right-0 z-40 bg-base-200 border-t border-base-300 p-4 shadow-xl max-h-[80dvh] h-[60vh] overflow-y-auto"
  >
    <div class="flex justify-between items-center mb-2">
      <h2 class="text-lg font-semibold">
        Reactions: {{ componentStore.selectedComponent.title }}
      </h2>
      <button class="btn btn-xs btn-outline" @click="showReactions = false">
        Close
      </button>
    </div>
    <component-reactions />
  </div>
</transition>


  </div>
</template>



<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()


const backButtonTop = computed(() => {
  return `${displayStore.headerHeight + 8}px` // add a little margin (e.g., 8px)
})

const componentStore = useComponentStore()
const showReactions = ref(false)

const resolvedComponent = computed(() => {
  return componentStore.selectedComponent?.componentName || null
})

function handleBack() {
  showReactions.value = false
  componentStore.clearSelectedComponent()
  
}
</script>

<style scoped>
.slide-up-down-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  transform: translateY(100%);
  opacity: 0;
}
.slide-up-down-enter-to {
  transform: translateY(0%);
  opacity: 1;
}
.slide-up-down-leave-active {
  transition: all 0.3s ease-in;
  transform: translateY(0%);
  opacity: 1;
}
.slide-up-down-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.slide-up-down-leave-from {
  transform: translateY(0%);
  opacity: 1;
}

.slide-up-down-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

</style>
