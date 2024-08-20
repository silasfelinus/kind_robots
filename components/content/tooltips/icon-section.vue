<template>
  <div :class="sectionClass">
    <div
      v-for="(icon, index) in icons"
      :key="index"
      class="flex-shrink-0 flex items-center justify-center"
      :class="iconSize"
    >
      <component :is="icon.component" v-bind="icon.props" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  icons: Array,
})

const sectionClass = computed(() => ({
  'md:flex md:flex-wrap items-center md:justify-end gap-2 overflow-x-auto':
    true,
}))

const iconSize = computed(() => ({
  'min-w-[100px] md:min-w-[50px]': true,
}))
</script>

<style scoped>
.flex-shrink-0 {
  min-width: 50px;
}
</style>
