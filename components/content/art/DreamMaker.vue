<template>
  <div class="bg-base-200 rounded-2xl p-8 text-lg">
    <h1 class="text-2xl mb-4">
      Dream Generator
    </h1>
    <button
      class="bg-accent rounded-2xl p-2 text-white"
      @click="getRandomDream"
    >
      Get Random Dream
    </button>
    <p v-if="randomDream">
      {{ randomDream }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'

const dreamStore = useDreamStore()
const randomDream = ref<string | null>(null)

const getRandomDream = () => {
  randomDream.value = dreamStore.randomDream()
}
</script>
