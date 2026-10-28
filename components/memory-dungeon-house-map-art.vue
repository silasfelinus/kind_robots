<template>
  <img
    v-if="available"
    :src="HOUSE_ATLAS_PATHS[reality]"
    alt=""
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
    loading="eager"
    decoding="async"
    draggable="false"
    data-testid="memory-house-painted-atlas"
    @error="available = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HOUSE_ATLAS_PATHS } from '~/utils/memoryDungeon/houseAtlas'

defineProps<{ reality: 'original' | 'mirrored' }>()
const available = ref(true)
</script>
