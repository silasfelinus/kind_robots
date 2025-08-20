<!-- /components/content/sandbox/sandbox-icon.vue -->
<template>
  <div
    class="p-2 rounded cursor-pointer border flex flex-col items-center gap-1 w-16"
    :class="active ? 'bg-primary text-white' : 'bg-base-100'"
    @click="$emit('click')"
  >
    <Icon :name="icon" class="text-2xl" />
    <div class="text-xs text-center leading-tight">{{ label }}</div>
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
