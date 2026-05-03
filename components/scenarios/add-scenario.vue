<!-- /components/content/weird/add-scenario.vue -->
<template>
  <scenario-form mode="add" @saved="emit('saved')" />
</template>

<script setup lang="ts">
const emit = defineEmits<{
  saved: []
}>()
</script>
