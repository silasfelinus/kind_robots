<template>
  <div :class="sectionClass">
    <div
      v-for="(Icon, index) in Icons"
      :key="index"
      class="flex-shrink-0 flex items-center justify-center"
      :class="IconSize"
    >
      <component :is="Icon.component" v-bind="Icon.props" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'

// Import or define the Icon interface here
interface Icon {
  component: string | object // Adjust this as needed based on your component structure
  props: Record<string, unknown>
}

// Define props with type annotation
const { Icons } = defineProps({
  Icons: {
    type: Array as PropType<Icon[]>,
    default: () => [],
  },
})

const sectionClass = computed(() => ({
  'md:flex md:flex-wrap items-center md:justify-end gap-2 overflow-x-auto':
    true,
}))

const IconSize = computed(() => ({
  'min-w-[100px] md:min-w-[50px]': true,
}))
</script>
