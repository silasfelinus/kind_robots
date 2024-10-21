<template>
  <div
    class="flex items-center space-x-2 border border-solid rounded-2xl group"
    :class="{ 'hover:bg-accent transition-colors': isExtended }"
  >
    <div
      class="flex items-center space-x-2 rounded-2xl p-2"
      :class="underConstruction ? 'bg-warning' : 'bg-secondary'"
    >
      <div
        v-if="icon && !underConstruction"
        class="text-3xl group-hover:text-4xl"
      >
        <Icon :name="icon" />
      </div>
      <div class="text-lg">
        {{ title }}
      </div>
    </div>
    <div v-if="isCurrentPage" class="ml-2 text-md text-info">
      <Icon name="kind-icon:download" class="text-lg" />
      You are here
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  title = 'Mysterious Portal',
  icon = 'kind-icon:magic-stick',
  isCurrentPage = false,
  underConstruction = false,
  isExtended = false,
} = defineProps<{
  title?: string
  icon?: string
  isCurrentPage?: boolean
  underConstruction?: boolean
  isExtended?: boolean
}>()
</script>
