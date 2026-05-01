<!-- /components/content/story/big-toggle.vue -->
<template>
  <div class="fixed p-1">
    <button
      type="button"
      class="flex h-8 w-8 transform items-center justify-center rounded-2xl font-semibold text-secondary shadow-lg transition-transform duration-300 ease-in-out hover:scale-110 hover:rotate-12"
      :title="buttonTitle"
      @click="toggleHeader"
    >
      <span
        class="toggle-icon text-secondary"
        style="
          background: linear-gradient(to bottom right, #f472b6, #fbbf24);
          background-clip: text;
          -webkit-background-clip: text;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        "
      >
        {{ iconText }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/big-toggle.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const isCompactHeader = computed(() => displayStore.headerState === 'compact')

const iconText = computed(() => (isCompactHeader.value ? '+' : '-'))

const buttonTitle = computed(() =>
  isCompactHeader.value ? 'Open header' : 'Compact header',
)

function toggleHeader() {
  displayStore.headerState = isCompactHeader.value ? 'open' : 'compact'
}
</script>
