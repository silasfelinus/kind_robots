<!-- /components/content/layout/popup-description.vue -->
<template>
  <div
    v-show="isHovered"
    class="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-full mt-[-20px] bg-base-300 p-2 rounded-2xl border z-40 flex items-center space-x-2"
    :class="{ 'flex-row': !streaming, 'flex-col': streaming }"
    style="z-index: 1000"
  >
    <div v-if="image" class="w-24 h-24 rounded-2xl overflow-hidden border">
      <img
        :src="`/images/${image}`"
        alt="Image"
        class="object-cover w-full h-full"
      />
    </div>
    <div class="text-3xl">
      <Icon :name="icon" />
    </div>
    <div class="text-sm rounded-2xl border p-2">
      {{ description }}
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  image = '',
  icon = 'kind-icon:info-circle',
  description = 'A New Page from Kind Robots',
  streaming = false,
  isHovered,
} = defineProps<{
  image?: string
  icon?: string
  description?: string
  streaming?: boolean
  isHovered: boolean
}>()
</script>
