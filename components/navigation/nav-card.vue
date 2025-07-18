<template>
  <component
    :is="tag"
    :to="tag === 'NuxtLink' ? props.to : undefined"
    @click="handleClick"
    class="group relative flex flex-col items-center text-center rounded-2xl p-4 transition-all cursor-pointer border w-full"
    :class="[
      `delay-${(props.delay ?? 0) * 100}`,
      isActive
        ? 'border-primary bg-base-300 cursor-default'
        : 'border-base-300 hover:bg-base-200 bg-base-100',
    ]"
  >
    <!-- Icon -->
    <Icon
      :name="props.icon"
      class="text-3xl text-primary mb-2 group-hover:scale-110 transition-transform"
    />

    <!-- Title -->
    <h3
      class="font-semibold text-base text-base-content group-hover:text-primary mb-1 leading-snug break-words"
    >
      {{ props.title }}
    </h3>

    <!-- Description -->
    <p class="text-sm text-base-content/80 leading-tight">
      {{ props.description || '' }}
    </p>

    <!-- Tooltip -->
    <div
      v-if="props.tooltip"
      class="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1 rounded bg-base-300 text-xs text-base-content shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
    >
      {{ props.tooltip }}
    </div>
  </component>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{
  title: string
  icon: string
  description?: string
  tooltip?: string
  to?: string
  onClick?: () => void
  delay?: number
}>()

const route = useRoute()
const router = useRouter()

const isActive = computed(() => (props.to ? route.path === props.to : false))

const tag = computed(() =>
  isActive.value || typeof props.onClick === 'function' ? 'div' : 'NuxtLink',
)

function handleClick() {
  if (isActive.value) return
  if (props.onClick) {
    props.onClick()
  } else if (props.to) {
    router.push(props.to)
  }
}
</script>
