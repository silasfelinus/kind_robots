<!-- /components/content/layout/smart-card.vue -->
<template>
  <component
    :is="tag"
    :to="tag === 'NuxtLink' ? link : undefined"
    @click="handleClick"
    class="group relative flex flex-col items-center text-center rounded-2xl p-4 transition-all cursor-pointer border w-full"
    :class="[
      `delay-${delay * 100}`,
      isActive
        ? 'border-primary bg-base-300 cursor-default'
        : 'border-base-300 hover:bg-base-200 bg-base-100',
    ]"
  >
    <!-- Favorite toggle (heart) -->
    <button
      class="absolute right-2 top-2 p-1 text-base-content/60 hover:text-error transition-colors"
      @click.stop="toggleFavorite"
      aria-label="Toggle favorite"
      :aria-pressed="isFavorite"
    >
      <Icon
        :name="isFavorite ? 'fa-solid:heart' : 'fa-regular:heart'"
        class="text-sm"
        :class="isFavorite ? 'text-error' : 'text-base-content/60'"
      />
    </button>

    <!-- Icon -->
    <Icon
      :name="iconName"
      class="text-3xl text-primary mb-2 group-hover:scale-110 transition-transform"
    />

    <!-- Title -->
    <h3
      class="font-semibold text-base text-base-content group-hover:text-primary mb-1 leading-snug break-words"
    >
      {{ title }}
    </h3>

    <!-- Description -->
    <p class="text-sm text-base-content/80 leading-tight">
      {{ description }}
    </p>

    <!-- Tooltip -->
    <div
      v-if="tooltip"
      class="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1 rounded bg-base-300 text-xs text-base-content shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
    >
      {{ tooltip }}
    </div>
  </component>
</template>

<script setup lang="ts">
// /components/content/layout/smart-card.vue
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '#components'
import { useNavStore } from '@/stores/navStore'
import type { SmartIcon } from '@/stores/smartbarStore'

const props = defineProps<{
  icon: SmartIcon
  delay?: number
}>()

const navStore = useNavStore()
const route = useRoute()
const router = useRouter()

const delay = computed(() => props.delay ?? 0)

const link = computed(() => props.icon.link || undefined)
const title = computed(() => props.icon.label || props.icon.title || '')
const iconName = computed(() => props.icon.icon || 'fa-solid:circle-question')
const description = computed(() => props.icon.description || '')
const tooltip = computed(() => props.icon.description || '')

const isActive = computed(() =>
  link.value ? route.path === link.value : false,
)

const isFavorite = computed(() =>
  link.value ? navStore.isFavorite(link.value) : false,
)

const tag = computed(() => (isActive.value || !link.value ? 'div' : 'NuxtLink'))

function handleClick() {
  if (isActive.value || !link.value) return
  router.push(link.value)
}

function toggleFavorite() {
  if (!link.value) return
  navStore.toggleFavorite(link.value)
}
</script>
