<!-- /components/narrative/narrative-ingredient-multi-picker.vue -->
<template>
  <section class="space-y-3">
    <div class="flex flex-wrap items-start gap-2">
      <div class="min-w-0 flex-1">
        <h3 class="text-xs font-bold uppercase tracking-wide text-base-content/55">
          {{ label }}
        </h3>
        <p v-if="helper" class="mt-1 text-xs leading-relaxed text-base-content/45">
          {{ helper }}
        </p>
      </div>
      <span v-if="loading" class="loading loading-spinner loading-sm" />
      <span v-else class="badge badge-ghost badge-sm rounded-xl">
        {{ modelValue.length }} / {{ maxSelections }} selected
      </span>
    </div>

    <label
      v-if="items.length > initialLimit"
      class="input input-bordered input-sm flex w-full items-center gap-2 rounded-xl bg-base-100"
    >
      <Icon name="kind-icon:search" class="size-4 text-base-content/45" />
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
      <Icon name="kind-icon:alert" class="mt-0.5 size-4 shrink-0" />
      <span>{{ error }}</span>
    </div>

    <div
      v-else-if="loading"
      class="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100/60"
    >
      <span class="loading loading-dots loading-md text-secondary" />
    </div>

    <div
      v-else-if="!items.length"
      class="rounded-2xl border border-dashed border-base-300 bg-base-100/60 p-4 text-center text-xs text-base-content/50"
    >
      {{ emptyState }}
    </div>

    <p
      v-else-if="query.trim() && !filteredItems.length"
      class="rounded-xl border border-dashed border-base-300 bg-base-100/60 px-3 py-2 text-xs text-base-content/45"
    >
      No matching {{ label.toLowerCase() }}.
    </p>

    <div v-else class="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
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
        class="btn btn-ghost btn-sm rounded-xl border border-base-300"
        :disabled="disabled"
        @click="expanded = !expanded"
      >
        <Icon
          :name="expanded ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'"
          class="size-4"
        />
        {{ expanded ? 'Show fewer' : `Show all ${filteredItems.length}` }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

const query = ref('')
const expanded = ref(false)

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
