<template>
  <!-- Base Card Container -->
  <div class="flex justify-center items-center h-full rounded-xl">
    <!-- Base Card -->
    <div :class="baseCardClasses">
      <!-- Card Header -->
      <div class="flex items-center justify-center mb-4">
        <Icon :name="props.IconName" class="mr-2 text-3xl" />
        <h3 class="text-3xl font-semibold">
          {{ props.title }}
        </h3>
      </div>
      <!-- Card Content -->
      <div class="text-lg">
        <!-- Use slot if available, otherwise use the content prop -->
        <slot v-if="$slots.default" />
        <div v-else>
          {{ props.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Define component props
const props = defineProps({
  title: {
    type: String,
    default: 'Kind Robots 🤖',
  },
  IconName: {
    type: String,
    default: 'mdi:robot',
  },
  content: {
    type: String,
    default: '',
  },
})

// Break down long class strings for better readability and maintainability
const baseCardClasses = computed(() =>
  [
    'bg-base-200',
    'border-xl',
    'p-8',
    'm-6',
    'rounded-xl',
    'shadow-md',
    'transition-transform',
    'transition-shadow',
    'duration-300',
    'ease-in-out',
    'hover:translate-y-[-10px]',
    'hover:shadow-lg',
    'backdrop-blur-md',
    'max-w-screen-sm',
    'text-center',
    'overflow-hidden',
  ].join(' '),
)
</script>
