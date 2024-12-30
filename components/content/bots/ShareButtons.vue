<template>
  <div class="share-buttons">
    <!-- Twitter Share Button -->
    <a
      :href="`https://twitter.com/intent/tweet?text=${text}&url=${url}`"
      target="_blank"
    >
      <Icon name="simple-Icons:x" class="twitter-Icon" />
    </a>

    <!-- Facebook Share Button -->
    <a
      :href="`https://www.facebook.com/sharer/sharer.php?u=${url}`"
      target="_blank"
    >
      <Icon name="kind-icon:facebook" class="facebook-Icon" />
    </a>
  </div>
</template>

<script setup lang="ts">
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
.twitter-Icon,
.facebook-Icon {
  font-size: 1.5rem;
}
</style>
