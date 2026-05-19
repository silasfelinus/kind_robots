<!-- /components/content/navigation/corner-toggle.vue -->
<template>
  <div class="flex h-full items-center">
    <div class="flex select-none flex-col items-end justify-center gap-1">
      <div class="flex items-center justify-end">
        <button
          type="button"
          :class="[
            'flex aspect-square items-center justify-center rounded-full transition hover:bg-base-300',
            isCompactHeader ? 'h-[60%] min-h-6' : 'h-[86%] min-h-8',
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
            :class="[isCompactHeader ? 'h-[60%] w-[60%]' : 'h-[74%] w-[74%]']"
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

const isCompactHeader = computed(() => displayStore.headerState === 'compact')
</script>
