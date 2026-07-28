<!-- /components/narrative/narrative-ingredient-card.vue -->
<template>
  <button
    type="button"
    class="group relative flex min-h-32 w-full overflow-hidden rounded-2xl border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 disabled:cursor-not-allowed disabled:opacity-50"
    :class="
      selected
        ? 'border-secondary bg-secondary/10 ring-1 ring-secondary/40'
        : 'border-base-300 bg-base-100 hover:border-secondary/40'
    "
    :aria-pressed="selected"
    :aria-label="`${selected ? 'Selected' : 'Select'} ${item.title}`"
    :disabled="disabled"
    @click="emit('select', item.slug)"
  >
    <span
      class="relative flex w-28 shrink-0 items-center justify-center overflow-hidden bg-base-200 sm:w-32"
    >
      <img
        v-if="artwork"
        :src="artwork"
        :alt="`${item.title} artwork`"
        class="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-105"
      />
      <Icon
        v-else
        :name="item.icon || 'kind-icon:tag'"
        class="size-8 text-base-content/35"
      />
      <span
        v-if="item.badge"
        class="badge badge-sm absolute left-2 top-2 max-w-[calc(100%_-_1rem)] truncate rounded-xl border-base-100/60 bg-base-100/90 text-[0.65rem] font-bold shadow-sm"
      >
        {{ item.badge }}
      </span>
    </span>

    <span class="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-3">
      <span class="flex items-start gap-2">
        <span class="min-w-0 flex-1 truncate text-sm font-black">
          {{ item.title }}
        </span>
        <Icon
          v-if="selected"
          name="kind-icon:check"
          class="mt-0.5 size-4 shrink-0 text-secondary"
        />
      </span>
      <span
        v-if="summary"
        class="line-clamp-3 text-xs leading-relaxed text-base-content/60"
      >
        {{ summary }}
      </span>
      <span v-else class="text-xs text-base-content/35">
        Add this ingredient to the narrative.
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  narrativeIngredientArtwork,
  narrativeIngredientSummary,
  type NarrativeIngredientOption,
} from '@/utils/narrativeIngredients'

const props = withDefaults(
  defineProps<{
    item: NarrativeIngredientOption
    selected?: boolean
    disabled?: boolean
  }>(),
  {
    selected: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  select: [slug: string]
}>()

const artwork = computed(() => narrativeIngredientArtwork(props.item))
const summary = computed(() => narrativeIngredientSummary(props.item))
</script>
