<!-- /components/builder/builder-input.vue -->
<template>
  <builder-preset-input v-if="inputType === 'preset'" />
  <builder-text-input v-else-if="inputType === 'text' || inputType === 'long'" />
  <builder-list-input v-else-if="inputType === 'list'" />
  <builder-stats-input v-else-if="inputType === 'stats'" />
  <builder-reward-input v-else-if="inputType === 'reward'" />
  <builder-art-input v-else-if="inputType === 'art'" />
  <builder-visibility-input v-else-if="inputType === 'visibility' || inputType === 'toggle'" />
  <builder-custom-input v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()
const inputType = computed(() => store.activeStep?.inputType ?? 'custom')
</script>
