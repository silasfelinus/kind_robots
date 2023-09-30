<template>
  <div class="bg-primary rounded-2xl p-2">
    <p>{{ art.prompt }}</p>
    <img :src="art.path" alt="Artwork" class="rounded-2xl" />
    <p>{{ art.pitch }}</p>
  </div>
</template>

<script setup lang="ts">
import { Art } from '@/stores/artStore'
const props = defineProps<{
  art: Art
}>()
</script>
