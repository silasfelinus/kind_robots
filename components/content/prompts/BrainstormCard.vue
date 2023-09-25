<template>
  <div class="bg-base-200 rounded-2xl p-2 m-2 border">
    <h3 class="text-lg font-bold">{{ idea.title }}</h3>
    <p class="text-base">{{ idea.example }}</p>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  idea: {
    title: {
      type: string,
      default: 'Shocking Idea'
    },
    example: {
      type: string,
      default: 'Hilarious Example'
    }
  }
})
</script>
