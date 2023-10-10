<template>
  <div class="share-buttons">
    <!-- Twitter Share Button -->
    <a :href="`https://twitter.com/intent/tweet?text=${text}&url=${url}`" target="_blank">
      <icon name="simple-icons:x" class="twitter-icon" />
    </a>

    <!-- Facebook Share Button -->
    <a :href="`https://www.facebook.com/sharer/sharer.php?u=${url}`" target="_blank">
      <icon name="bi:facebook" class="facebook-icon" />
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { url, text } = defineProps<{
  url: string
  text: string
  botName: string
  subtitle: string
}>()
</script>

<style scoped>
.share-buttons {
  display: flex;
  gap: 1rem;
}
.twitter-icon,
.facebook-icon {
  font-size: 1.5rem;
}
</style>
