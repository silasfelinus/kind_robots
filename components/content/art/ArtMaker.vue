<!-- /components/ArtMaker.vue -->
<template>
  <div>
    <input v-model="prompt" />
    <button @click="generateArt">Generate Art</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

const artStore = useArtStore()
const prompt = ref('')
const designer = computed(() => userStore.username)

const generateArt = () => {
  artStore.generateArt(prompt.value, 'cafefred', { designer })
}
</script>
