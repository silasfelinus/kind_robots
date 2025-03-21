<template>
  <streaming-tooltip
    v-if="tooltip && amitip"
    :tooltip="tooltip"
    :amitip="amitip"
    class="w-full h-full overflow-visible"
  />
</template>

<script setup lang="ts">
import { usePageStore } from '@/stores/pageStore'

const { tooltip, amitip } = storeToRefs(usePageStore())
</script>
