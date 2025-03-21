<template>
  <div class="fixed bottom-4 right-4" @click="toggleTooltip">
    <!-- Pulsing Butterfly Icon -->
    <div v-if="!tooltipOpen && tooltip" class="cursor-pointer">
      <Icon name="ph:butterfly-duotone" class="text-3xl animate-pulse" />
    </div>

    <!-- Tooltip Popup -->
    <div
      v-else-if="tooltipOpen && tooltip"
      class="tooltip-popup bg-base-300 p-4 rounded-2xl border"
    >
      <div>
        <span class="font-semibold">
          <butterfly-loader />
          <Icon name="kind-icon:chat" class="text-default mr-2 text-2xl" />
          AMI Says:
          <span class="text-default text-xl">{{ tooltip }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const { tooltip } = storeToRefs(usePageStore())

const tooltipOpen = ref(false)
const toggleTooltip = () => {
  tooltipOpen.value = !tooltipOpen.value
}
</script>

<style scoped>
.tooltip-popup {
  max-width: 300px;
}
</style>
