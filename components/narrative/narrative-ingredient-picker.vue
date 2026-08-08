<!-- /components/narrative/narrative-ingredient-picker.vue -->
<template>
  <section
    class="space-y-3"
    role="group"
    :aria-labelledby="headingId"
    :aria-describedby="helper ? helperId : undefined"
    :aria-busy="loading"
  >
    <div class="flex flex-wrap items-start gap-2">
      <div class="min-w-0 flex-1">
        <h3
          :id="headingId"
          class="text-xs font-bold uppercase tracking-wide text-base-content/55"
        >
          {{ label }}
        </h3>
        <p
          v-if="helper"
          :id="helperId"
          class="mt-1 text-xs leading-relaxed text-base-content/45"
        >
          {{ helper }}
        </p>
      </div>
      <span
        v-if="loading"
        class="loading loading-spinner loading-sm motion-reduce:hidden"
        aria-hidden="true"
      />
      <span
        v-else
        class="badge badge-ghost badge-sm rounded-xl"
        aria-live="polite"
      >
        {{ items.length }} options
      </span>
    </div>

    <label
      v-if="items.length > initialLimit"
      class="input input-bordered input-sm flex w-full items-center gap-2 rounded-xl bg-base-100"
    >
      <Icon
        name="kind-icon:search"
        class="size-4 text-base-content/45"
        aria-hidden="true"
      />
      <input
        v-model="query"
        type="search"
        class="grow bg-transparent"
        :aria-label="`Search ${label}`"
        :placeholder="`Search ${label.toLowerCase()}…`"
        :disabled="disabled || loading"
      />
    </label>

    <p
      v-if="query.trim() && !filteredItems.length"
      role="status"
      class="rounded-xl border border-dashed border-base-300 bg-base-100/60 px-3 py-2 text-xs text-base-content/45"
    >
      No matching {{ label.toLowerCase() }}. Clear the search or leave the
      narrator free to choose.
    </p>

    <div
      v-if="error"
      role="alert"
      class="flex items-start gap-2 rounded-2xl border border-error/30 bg-error/5 p-3 text-xs text-error"
    >
      <Icon
        name="kind-icon:alert"
        class="mt-0.5 size-4 shrink-0"
        aria-hidden="true"
      />
      <span>{{ error }}</span>
    </div>

    <div
      v-else-if="loading"
      role="status"
      class="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100/60"
    >
      <span
        class="loading loading-dots loading-md text-secondary motion-reduce:hidden"
        aria-hidden="true"
      />
      <span class="sr-only">Loading {{ label.toLowerCase() }}.</span>
    </div>

    <div
      v-else-if="!items.length"
      role="status"
      class="rounded-2xl border border-dashed border-base-300 bg-base-100/60 p-4 text-center text-xs text-base-content/50"
    >
      {{ emptyState }}
    </div>

    <div v-else class="grid gap-2 md:grid-cols-2">
      <button
        v-if="allowEmpty"
        type="button"
        class="flex min-h-32 w-full overflow-hidden rounded-2xl border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"
        :class="
          modelValue === null
            ? 'border-secondary bg-secondary/10 ring-1 ring-secondary/40'
            : 'border-base-300 bg-base-100 hover:border-secondary/40'
        "
        :aria-pressed="modelValue === null"
        :aria-label="`${modelValue === null ? 'Selected' : 'Select'} ${emptyLabel}`"
        :aria-describedby="emptyDescriptionId"
        :disabled="disabled"
        @click="select(null)"
      >
        <span
          class="flex w-28 shrink-0 items-center justify-center bg-base-200 sm:w-32"
          aria-hidden="true"
        >
          <Icon :name="emptyIcon" class="size-8 text-base-content/35" />
        </span>
        <span class="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-3">
          <span class="flex items-start gap-2">
            <span class="min-w-0 flex-1 truncate text-sm font-black">
              {{ emptyLabel }}
            </span>
            <Icon
              v-if="modelValue === null"
              name="kind-icon:check"
              class="mt-0.5 size-4 shrink-0 text-secondary"
              aria-hidden="true"
            />
          </span>
          <span
            :id="emptyDescriptionId"
            class="text-xs leading-relaxed text-base-content/55"
          >
            {{ emptyDescription }}
          </span>
        </span>
      </button>

      <NarrativeIngredientCard
        v-for="item in visibleItems"
        :key="item.id ?? item.slug"
        :item="item"
        :selected="item.slug === modelValue"
        :disabled="disabled"
        @select="select"
      />
    </div>

    <div v-if="showToggle" class="flex justify-center">
      <button
        type="button"
        class="btn btn-ghost btn-sm rounded-xl border border-base-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 motion-reduce:transform-none motion-reduce:transition-none"
        :disabled="disabled"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        <Icon
          :name="expanded ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'"
          class="size-4"
          aria-hidden="true"
        />
        {{ expanded ? 'Show fewer' : `Show all ${filteredItems.length}` }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import type { NarrativeIngredientOption } from '@/utils/narrativeIngredients'

const props = withDefaults(
  defineProps<{
    modelValue: string | null
    items: NarrativeIngredientOption[]
    label: string
    helper?: string
    emptyLabel?: string
    emptyDescription?: string
    emptyIcon?: string
    emptyState?: string
    allowEmpty?: boolean
    disabled?: boolean
    loading?: boolean
    error?: string | null
    initialLimit?: number
  }>(),
  {
    helper: '',
    emptyLabel: 'Any ingredient',
    emptyDescription: 'Let the narrator choose what fits the story.',
    emptyIcon: 'kind-icon:wand',
    emptyState: 'No narrative ingredients are available yet.',
    allowEmpty: true,
    disabled: false,
    loading: false,
    error: null,
    initialLimit: 8,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const pickerId = useId()
const headingId = `${pickerId}-heading`
const helperId = `${pickerId}-helper`
const emptyDescriptionId = `${pickerId}-empty-description`
const query = ref('')
const expanded = ref(false)

const filteredItems = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return props.items
  return props.items.filter((item) =>
    [
      item.title,
      item.slug,
      item.description,
      item.flavorText,
      item.badge,
    ].some((value) => value?.toLowerCase().includes(needle)),
  )
})

const visibleItems = computed(() => {
  if (query.value.trim() || expanded.value) return filteredItems.value
  return filteredItems.value.slice(0, Math.max(1, props.initialLimit))
})

const showToggle = computed(
  () =>
    !query.value.trim() &&
    filteredItems.value.length > Math.max(1, props.initialLimit),
)

watch(
  () => props.items.length,
  () => {
    expanded.value = false
  },
)

function select(value: string | null) {
  emit('update:modelValue', value)
}
</script>
