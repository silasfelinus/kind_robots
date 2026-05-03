<!-- /components/content/weird/edit-scenario.vue -->
<template>
  <scenario-form mode="edit" @saved="emit('saved')" />
</template>

<script setup lang="ts">
const emit = defineEmits<{
  saved: []
}>()
</script>
