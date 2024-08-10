<template>
  <div>
    <layout-selector class="absolute hidden" />
    <NuxtLayout :key="currentLayout" :name="currentLayout">
      <ContentDoc />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLayoutStore } from '@/stores/layoutStore';

const layoutStore = useLayoutStore();

// Computed property to get the current layout from the store
const currentLayout: any = computed(() => layoutStore.currentLayout);
</script>
