<!-- /components/content/story/right-toggle.vue -->
<template>
  <div v-if="!inline" class="fixed p-1 bg-base-200 z-50">
    <button
      @click="handleClick"
      class="w-8 h-8 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300 ease-in-out"
      :class="isHighlighted ? 'text-primary' : 'text-secondary'"
    >
      <Icon
        :name="isHighlighted ? 'kind-icon:question-glow' : 'kind-icon:question'"
        class="w-6 h-6"
      />
    </button>
  </div>

  <button
    v-else
    @click="handleClick"
    class="btn btn-square btn-sm"
    :class="isHighlighted ? 'btn-primary' : ''"
    :title="isHighlighted ? 'Hide Tutorial' : 'Show Tutorial'"
    :aria-pressed="isHighlighted"
  >
    <Icon
      :name="isHighlighted ? 'kind-icon:question-glow' : 'kind-icon:question'"
    />
  </button>
</template>

<script setup lang="ts">
// /components/content/story/right-toggle.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const props = defineProps<{ inline?: boolean }>()
const displayStore = useDisplayStore()

const isHighlighted = computed({
  get: () => displayStore.sidebarRightState === 'open',
  set: (val: boolean) => displayStore.setSidebarRight(val),
})

function handleClick() {
  isHighlighted.value = !isHighlighted.value
}
</script>
