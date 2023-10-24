<template>
  <div :class="{ 'text-right': align === 'right' }" class="mb-2">
    <div :class="bubbleClasses">
      <p class="text-sm">{{ message }}</p>
    </div>
    <div :class="{ 'ml-auto': align === 'right' }" class="text-sm mt-1">{{ sender }}</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  message: string
  sender: string
  align: 'left' | 'right'
}>()

const { message, sender, align } = props

const bubbleClasses = ['p-3', 'rounded-lg', align === 'left' ? 'bg-base-200' : 'bg-info']
</script>
