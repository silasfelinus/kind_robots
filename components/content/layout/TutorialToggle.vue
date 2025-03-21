<template>
  <div
    class="flex justify-center items-center bg-primary hover:bg-accent transition duration-300 cursor-pointer rounded-lg shadow-md p-3"
    @click="toggleTutorial"
  >
    <Icon
      v-if="showTutorial"
      name="mdi-information-outline"
      class="text-base-200 w-8 h-8"
    />
    <Icon v-else :name="icon || 'mdi-page-layout-sidebar-right'" class="text-base-200 w-8 h-8" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const showTutorial = computed(() => displayStore.showTutorial)
const toggleTutorial = () => displayStore.toggleTutorial()

const { icon } = storeToRefs(pageStore)
</script>
