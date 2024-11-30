<template>
  <div
    class="w-full h-full bg-gray-800 flex items-center justify-center rounded-lg shadow-md"
  >
    <img
      v-if="imageId"
      :src="`/images/${imageId}.jpg`"
      alt="Character Portrait"
      class="object-cover w-full h-full rounded-lg"
    />
    <img
      v-else
      src="/images/bot.webp"
      alt="Default Portrait"
      class="object-cover w-full h-full rounded-lg"
    />
  </div>
</template>

<script setup>
defineProps({
  imageId: {
    type: [String, Number],
    default: null,
  },
})
</script>
