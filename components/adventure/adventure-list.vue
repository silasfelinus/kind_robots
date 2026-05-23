<!-- components/adventure/adventure-list.vue -->
<!--
  Searchable list for inputType: 'list'.
  Source: step.generatorKey → generatorStore.getList(key).
  Also accepts step.listOptions directly (for sub-lists from preset choices).

  UX flow:
    - Search filters the chip grid in real time
    - Clicking a chip commits immediately via store.setStagedValue
    - Dice button fills a random entry (no LLM)
    - Custom input at bottom for anything not in the list

  No emits. All state via store.
-->
<template>
  <div class="flex flex-col gap-4">
    <!-- Search + random row -->
    <div class="flex gap-2">
      <div class="relative flex-1">
        <Icon
          name="kind-icon:search"
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/30"
        />
        <input
          v-model="query"
          type="text"
          class="input input-bordered w-full rounded-2xl bg-base-100 pl-9 transition-colors focus:border-primary"
          :placeholder="`Search ${listLabel}...`"
        />
        <button
          v-if="query"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content/70"
          @click="query = ''"
        >
          <Icon name="kind-icon:x" class="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        type="button"
        class="btn btn-ghost gap-2 rounded-2xl border border-base-300 hover:border-secondary hover:bg-secondary/10"
        title="Pick one at random"
        @click="pickRandom"
      >
        <Icon name="kind-icon:dice" class="h-4 w-4" />
        <span class="hidden sm:inline">Random</span>
      </button>
    </div>

    <!-- Selected value display -->
    <Transition name="value-pop">
      <div
        v-if="currentValue"
        class="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/8 px-4 py-2.5"
      >
        <Icon name="kind-icon:check" class="h-4 w-4 shrink-0 text-primary" />
        <p class="flex-1 text-sm font-bold text-primary">{{ currentValue }}</p>
        <button
          type="button"
          class="ml-auto text-primary/50 hover:text-primary"
          @click="clearValue"
        >
          <Icon name="kind-icon:x" class="h-3.5 w-3.5" />
        </button>
      </div>
    </Transition>

    <!-- Chip grid -->
    <div
      v-if="filteredList.length"
      class="max-h-64 overflow-y-auto overscroll-contain rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <div class="flex flex-wrap gap-2">
        <button
          v-for="item in filteredList"
          :key="item"
          type="button"
          class="chip-btn rounded-xl border px-3 py-1.5 text-sm font-semibold transition-all duration-150"
          :class="
            currentValue === item
              ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20'
              : 'border-base-300 bg-base-200 text-base-content/75 hover:border-primary/50 hover:bg-primary/8 hover:text-primary'
          "
          @click="selectItem(item)"
        >
          {{ item }}
        </button>
      </div>

      <!-- Empty state within scrollable area -->
      <p
        v-if="!filteredList.length && query"
        class="py-4 text-center text-sm italic text-base-content/40"
      >
        Nothing matches "{{ query }}". Try the custom field below.
      </p>
    </div>

    <!-- No list at all -->
    <div
      v-else-if="!fullList.length"
      class="rounded-2xl border border-dashed border-base-300 bg-base-200/50 p-4 text-center text-sm italic text-base-content/40"
    >
      No suggestions loaded. Use the custom field below.
    </div>

    <!-- Result count hint -->
    <p v-if="query && filteredList.length" class="text-xs text-base-content/40">
      {{ filteredList.length }} of {{ fullList.length }} shown
    </p>

    <!-- Custom input -->
    <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
      <p
        class="mb-2 text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Or write your own
      </p>

      <div class="flex gap-2">
        <input
          v-model="customValue"
          type="text"
          class="input input-bordered flex-1 rounded-xl bg-base-200 text-sm transition-colors focus:border-primary focus:bg-base-100"
          :placeholder="activeStep?.placeholder ?? 'Anything that fits...'"
          @keydown.enter="commitCustom"
        />
        <button
          type="button"
          class="btn btn-sm btn-primary rounded-xl"
          :disabled="!customValue.trim()"
          @click="commitCustom"
        >
          Use
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAdventureStore } from '@/stores/adventureStore'
import { useGeneratorStore } from '@/stores/generatorStore'

const store = useAdventureStore()
const generator = useGeneratorStore()

// ── Store reads ─────────────────────────────────────────────────────────────

const activeStep = computed(() => store.activeStep)
const stepKey = computed(() => activeStep.value?.key ?? '')

const currentValue = computed({
  get: () => store.stagedValues[stepKey.value] ?? '',
  set: (val: string) => store.setStagedValue(stepKey.value, val),
})

// ── List source ─────────────────────────────────────────────────────────────

/**
 * Full list comes from either:
 *   1. step.listOptions (direct array — used by sub-list flow from preset)
 *   2. step.generatorKey → generatorStore.getList(key)
 */
const fullList = computed<string[]>(() => {
  if (activeStep.value?.listOptions?.length) {
    return activeStep.value.listOptions
  }
  if (activeStep.value?.generatorKey) {
    return generator.getList(activeStep.value.generatorKey)
  }
  return []
})

const listLabel = computed(
  () => activeStep.value?.inputLabel ?? activeStep.value?.title ?? 'options',
)

// ── Search ──────────────────────────────────────────────────────────────────

const query = ref('')

// Reset on step change
watch(activeStep, () => {
  query.value = ''
  customValue.value = ''
})

const filteredList = computed<string[]>(() => {
  if (!query.value.trim()) return fullList.value
  const q = query.value.toLowerCase()
  return fullList.value.filter((item) => item.toLowerCase().includes(q))
})

// ── Custom input ────────────────────────────────────────────────────────────

const customValue = ref('')

// ── Interactions ────────────────────────────────────────────────────────────

function selectItem(item: string) {
  currentValue.value = item
  query.value = ''
}

function clearValue() {
  currentValue.value = ''
}

function commitCustom() {
  const val = customValue.value.trim()
  if (!val) return
  currentValue.value = val
  customValue.value = ''
}

function pickRandom() {
  if (!fullList.value.length) return
  const item = fullList.value[
    Math.floor(Math.random() * fullList.value.length)
  ] as string
  currentValue.value = item
  query.value = ''
}
</script>

<style scoped>
/* Chip hover micro-lift */
.chip-btn:hover {
  transform: translateY(-1px);
}
.chip-btn:active {
  transform: translateY(0);
}

/* Selected value pop */
.value-pop-enter-active {
  transition:
    opacity 200ms ease,
    transform 200ms cubic-bezier(0.34, 1.4, 0.64, 1);
}
.value-pop-leave-active {
  transition: opacity 120ms ease;
}
.value-pop-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
.value-pop-leave-to {
  opacity: 0;
}
</style>
