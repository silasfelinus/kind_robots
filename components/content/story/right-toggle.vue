<!-- /components/content/layout/right-toggle.vue -->
<template>
  <div class="fixed p-1 bg-base-200">
    <button
      @click="handleClick"
      class="w-8 h-8 rounded-2xl flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 duration-300 ease-in-out"
      :class="isHighlighted ? 'text-primary' : 'text-secondary'"
    >
      <Icon
        :name="isHighlighted ? 'kind-icon:question-glow' : 'kind-icon:question'"
        class="w-6 h-6"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
// /components/InfoToggle.vue
import { ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const isHighlighted = computed({
  get: () => displayStore.sidebarRightState === 'open',
  set: (val: boolean) => displayStore.setSidebarRight(val),
})

const handleClick = () => {
  isHighlighted.value = !isHighlighted.value
}
</script>
