<template>
  <div class="min-x-200 min-y-100 bg-base-200 rounded-2xl p-2 m-2 border">
    <h3 class="text-lg font-bold">{{ idea.title }}</h3>
    <p class="text-base">{{ idea.example }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  idea: {
    type: Object,
    default: () => ({
      title: 'Shocking Idea',
      example: 'Hilarious Example'
    })
  }
})
</script>
