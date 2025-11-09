<!-- /components/content/navigation/corner-toggle.vue -->
<template>
  <div class="h-full flex items-center">
    <div class="flex flex-col justify-center items-end gap-1 select-none">
      <!-- Center / Corner menu toggle -->
      <div class="flex items-center justify-end">
        <button
          :class="[
            'rounded-full aspect-square flex items-center justify-center hover:bg-base-300 transition',
            bigMode ? 'h-[60%] min-h-6' : 'h-[86%] min-h-8',
            displayStore.showCorner ? 'ring-1 ring-primary/50' : '',
          ]"
          :title="
            displayStore.showCorner ? 'Hide Corner Menu' : 'Show Corner Menu'
          "
          :aria-pressed="displayStore.showCorner"
          @click="displayStore.toggleCorner()"
        >
          <Icon
            :name="
              displayStore.showCorner
                ? 'kind-icon:panel-right'
                : 'kind-icon:panel-right-close'
            "
            :class="[bigMode ? 'h-[60%] w-[60%]' : 'h-[74%] w-[74%]']"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/navigation/corner-toggle.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const bigMode = computed(() => displayStore.bigMode)
</script>
