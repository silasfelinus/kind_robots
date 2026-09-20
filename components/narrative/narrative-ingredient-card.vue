<!-- /components/narrative/narrative-ingredient-card.vue -->
<template>
  <button
    type="button"
    class="group relative flex aspect-[2/3] min-h-56 w-full flex-col overflow-hidden rounded-[1.5rem] border text-left shadow-md transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"
    :class="
      selected
        ? 'border-secondary ring-2 ring-secondary/45'
        : 'border-base-300 bg-base-100 hover:border-secondary/45'
    "
    :aria-pressed="selected"
    :aria-label="
      item.locked
        ? `Locked${item.unlockHint ? ` — ${item.unlockHint}` : ''}`
        : `${selected ? 'Selected' : 'Select'} ${item.title}`
    "
    :aria-describedby="descriptionId"
    :disabled="disabled || item.locked"
    @click="emit('select', item.slug)"
  >
    <template v-if="item.locked">
      <span
        class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-linear-to-br from-base-300 to-base-200 p-3 text-center"
        aria-hidden="true"
      >
        <Icon name="kind-icon:lock" class="kr-icon-8 text-base-content/40" />
      </span>
      <span
        class="relative z-10 mt-auto flex min-w-0 flex-col items-center gap-1.5 p-3 text-center"
      >
        <span class="kr-text-black-sm leading-tight text-base-content/60">
          Locked
        </span>
        <span
          v-if="item.unlockHint"
          :id="descriptionId"
          class="line-clamp-3 text-[0.7rem] leading-relaxed text-base-content/50"
        >
          {{ item.unlockHint }}
        </span>
      </span>
    </template>
    <template v-else>
      <span class="absolute inset-0 bg-base-200" aria-hidden="true">
        <img
          v-if="artwork && !artFailed"
          :src="artwork"
          alt=""
          class="kr-img-cover transition duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
          @error="artFailed = true"
        />
        <span
          v-else
          class="flex size-full items-center justify-center bg-linear-to-br from-base-200 to-base-300"
        >
          <ArtPendingPlaceholder
            v-if="artFailed"
            :pending="artPending"
            :failed="true"
          />
          <Icon
            v-else
            :name="item.icon || 'kind-icon:tag'"
            class="size-12 text-base-content/30"
          />
        </span>
      </span>

      <span
        class="absolute inset-0 bg-linear-to-t from-black/90 via-black/15 to-transparent"
        aria-hidden="true"
      />

      <span
        v-if="item.badge"
        class="kr-badge-sm absolute left-2 top-2 z-10 max-w-[calc(100%_-_3.25rem)] truncate rounded-xl border-white/30 bg-black/55 text-[0.62rem] font-bold text-white shadow backdrop-blur"
      >
        {{ item.badge }}
      </span>

      <span
        v-if="selected"
        class="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-content shadow-lg"
        aria-hidden="true"
      >
        <Icon name="kind-icon:check" class="kr-icon-4" />
      </span>

      <span
        class="relative z-10 mt-auto flex min-w-0 flex-col gap-1.5 p-3 text-white"
      >
        <span class="kr-text-black-sm leading-tight sm:text-base">
          {{ item.title }}
        </span>
        <span
          v-if="summary"
          :id="descriptionId"
          class="line-clamp-3 text-[0.7rem] leading-relaxed text-white/75"
        >
          {{ summary }}
        </span>
        <span v-else :id="descriptionId" class="text-[0.7rem] text-white/60">
          Add this ingredient to the story.
        </span>
      </span>
    </template>
  </button>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import {
  narrativeIngredientArtwork,
  narrativeIngredientSummary,
  type NarrativeIngredientOption,
} from '@/utils/narrativeIngredients'
import { useArtPendingState } from '@/composables/useArtPendingState'

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

const cardId = useId()
const descriptionId = `${cardId}-description`
const artwork = computed(() => narrativeIngredientArtwork(props.item))
const summary = computed(() => narrativeIngredientSummary(props.item))

// A dealt hand reuses this component across different cards by slug, so a
// failure recorded for one card's art must not bleed into the next one dealt
// into the same slot (interface-vision/t-138).
const artFailed = ref(false)
watch(
  () => props.item.slug,
  () => {
    artFailed.value = false
  },
)

const { pending: artPending } = useArtPendingState(() => artwork.value || '')
</script>
