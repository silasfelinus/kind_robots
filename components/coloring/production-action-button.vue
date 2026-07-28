<template>
  <button
    type="button"
    class="btn rounded-2xl"
    :class="armed ? 'btn-warning' : enabled ? 'btn-primary' : 'btn-disabled'"
    :disabled="!enabled || busy"
    @click="emit('click')"
  >
    <span v-if="busy" class="loading loading-spinner loading-sm" />
    <icon v-else :name="iconName" class="size-5" />
    {{ armed ? confirmLabel : label }}
  </button>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  confirmLabel: string
  iconName: string
  enabled?: boolean
  armed?: boolean
  busy?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
