<template>
  <main>
    <NuxtLayout :key="currentLayout" :name="currentLayout">
      <ContentDoc path="/galleries/">
        <template #not-found> Galleries Not Found </template>
        <template #empty>Gallery is missing! Probably due to a human... </template>
      </ContentDoc>
    </NuxtLayout>
  </main>
</template>
<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useLayoutStore } from '@/stores/layoutStore'

const layoutStore = useLayoutStore()

// Computed property to get the current layout from the store
const currentLayout = computed(() => layoutStore.currentLayout)
</script>
