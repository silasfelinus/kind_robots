<!-- /components/content/layout/tutorial-toggle.vue -->
<template>
  <button
    type="button"
    class="group flex justify-center items-center rounded-full border border-base-content/30 hover:border-primary focus:outline-none transition-all duration-300 w-10 h-10 sm:w-11 sm:h-11"
    @click="toggleTutorial"
  >
    <Icon
      v-if="showTutorial"
      name="kind-icon:info"
      class="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300"
    />
    <Icon
      v-else
      :name="icon || 'kind-icon:tutorial'"
      class="w-6 h-6 text-base-content/70 group-hover:text-primary group-hover:scale-110 transition-all duration-300"
    />
  </button>
</template>

<script setup lang="ts">
// /components/content/layout/tutorial-toggle.vue
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const showTutorial = computed(() => displayStore.showTutorial)
const toggleTutorial = () => displayStore.toggleTutorial()

const { icon } = storeToRefs(pageStore)
</script>
