<!-- /components/ArtReactor.vue -->
<template>
  <div>
    <button @click="handleReaction('clap')">👏 Clap</button>
    <button @click="handleReaction('boo')">👎 Boo</button>
    <!-- More toggles here -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useArtStore } from '@/stores/artStore'

const artStore = useArtStore()
const artId = ref(1) // Replace with actual artId

const handleReaction = (type: string) => {
  artStore.handleReactions(artId.value, { type })
}
</script>
