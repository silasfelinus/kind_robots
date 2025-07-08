<!-- /components/content/sandbox/sandbox-icon.vue -->
<template>
  <button
    class="btn btn-square btn-sm tooltip tooltip-right"
    :data-tip="label"
    @click="$emit('click')"
  >
    <Icon :name="icon" class="text-xl" />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  label?: string
}>()

defineEmits(['click'])
</script>
