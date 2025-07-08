<!-- sandbox-icon.vue -->
<template>
  <div
    class="p-2 rounded cursor-pointer border"
    :class="active ? 'bg-primary text-white' : 'bg-base-100'"
    @click="$emit('click')"
  >
    <div>{{ icon }}</div>
    <div class="text-xs">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  label: string
  active?: boolean
}>()

defineEmits(['click'])
</script>
