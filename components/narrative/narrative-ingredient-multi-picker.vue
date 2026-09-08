<!-- /components/narrative/narrative-ingredient-multi-picker.vue -->
<template>
  <section
    class="space-y-3 rounded-[1.75rem] border border-base-300 bg-base-100/85 p-4 shadow-sm"
    role="group"
    :aria-labelledby="headingId"
    :aria-describedby="describedBy"
    :aria-busy="loading"
  >
    <div class="flex flex-wrap items-start gap-2">
      <div class="min-w-0 flex-1">
        <h3 :id="headingId" class="text-lg font-black">
          {{ label }}
        </h3>
        <p
          v-if="helper"
          :id="helperId"
          class="kr-text-dim-xs mt-1 max-w-3xl leading-relaxed"
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
        :id="countId"
        class="kr-badge-ghost-sm rounded-xl"
        aria-live="polite"
      >
        {{ modelValue.length }} / {{ maxSelections }} selected
      </span>
    </div>

    <p v-if="atLimit" class="sr-only" role="status" aria-live="polite">
      Maximum selections reached. Remove one selection before choosing another.
    </p>

    <label
      v-if="searchVisible"
      class="kr-input-sm flex w-full max-w-xl items-center gap-2 bg-base-100"
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
      class="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100/60"
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
      class="kr-text-dim-xs rounded-2xl border border-dashed border-base-300 bg-base-100/60 p-5 text-center"
    >
      {{ emptyState }}
    </div>

    <p
      v-else-if="query.trim() && !filteredItems.length"
      role="status"
      class="kr-text-dim-xs-45 rounded-xl border border-dashed border-base-300 bg-base-100/60 px-3 py-2"
    >
      No matching {{ label.toLowerCase() }}.
    </p>

    <div
      v-else
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-3"
    >
      <NarrativeIngredientCard
        v-for="item in visibleItems"
        :key="item.id ?? item.slug"
        :item="item"
        :selected="modelValue.includes(item.slug)"
        :disabled="
          disabled ||
          (!modelValue.includes(item.slug) && modelValue.length >= maxSelections)
        "
        @select="toggle"
      />
    </div>

    <div v-if="showToggle" class="flex justify-center">
      <button
        type="button"
        class="btn btn-ghost btn-sm rounded-xl border border-base-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 motion-reduce:transition-none"
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
    modelValue: string[]
    items: NarrativeIngredientOption[]
    label: string
    helper?: string
    emptyState?: string
    disabled?: boolean
    loading?: boolean
    error?: string | null
    initialLimit?: number
    maxSelections?: number
  }>(),
  {
    helper: '',
    emptyState: 'No narrative ingredients are available yet.',
    disabled: false,
    loading: false,
    error: null,
    initialLimit: 8,
    maxSelections: 5,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const pickerId = useId()
const headingId = `${pickerId}-heading`
const helperId = `${pickerId}-helper`
const countId = `${pickerId}-count`
const query = ref('')
const expanded = ref(false)

const atLimit = computed(() => props.modelValue.length >= props.maxSelections)
const describedBy = computed(() =>
  [props.helper ? helperId : '', props.loading ? '' : countId]
    .filter(Boolean)
    .join(' '),
)

const searchVisible = computed(
  () => props.items.length > Math.max(1, props.initialLimit),
)

const filteredItems = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return props.items
  return props.items.filter((item) =>
    [item.title, item.slug, item.description, item.flavorText, item.badge].some(
      (value) => value?.toLowerCase().includes(needle),
    ),
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

watch(
  () => [props.items, props.modelValue] as const,
  ([items, values]) => {
    if (!values.length) return
    const maxIndex = Math.max(
      ...values.map((slug) => items.findIndex((item) => item.slug === slug)),
    )
    if (maxIndex >= Math.max(1, props.initialLimit)) expanded.value = true
  },
  { immediate: true },
)

watch(searchVisible, (visible) => {
  if (!visible) query.value = ''
})

function toggle(slug: string) {
  if (props.modelValue.includes(slug)) {
    emit(
      'update:modelValue',
      props.modelValue.filter((value) => value !== slug),
    )
    return
  }
  if (props.modelValue.length >= props.maxSelections) return
  emit('update:modelValue', [...props.modelValue, slug])
}
</script>
