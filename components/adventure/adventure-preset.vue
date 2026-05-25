<!-- components/adventure/adventure-preset.vue -->
<!--
  Illustrated CYOA choice buttons.
  Reads activeStep.choices from adventureStore.
  No emits. All state via store.

  Single-select flow (default):
    normal choice  → store.selectPresetChoice(step.key, value) → auto-advance
    opensCustom    → reveals inline text input
    opensList      → reveals sub-list chips

  Multi-select flow (step.multiSelect: true):
    choices toggle in/out of a local Set
    value stored as pipe-separated string via store.setStagedValue
    "Done" button appears when at least one is selected
    Sub-flows (opensCustom / opensList) still work, appending to selection
-->
<template>
  <div class="flex flex-col gap-4">
    <!-- Multi-select selection bar -->
    <Transition name="slide-down">
      <div
        v-if="isMultiSelect && selectedValues.size > 0"
        class="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-primary/8 px-4 py-2.5"
      >
        <Icon name="kind-icon:check" class="h-4 w-4 shrink-0 text-primary" />
        <div class="flex flex-1 flex-wrap gap-1.5">
          <span
            v-for="val in selectedValues"
            :key="val"
            class="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary"
          >
            {{ labelForValue(val) }}
            <button
              type="button"
              class="ml-0.5 opacity-60 hover:opacity-100"
              @click="toggleValue(val)"
            >
              <Icon name="kind-icon:x" class="h-3 w-3" />
            </button>
          </span>
        </div>
        <span class="shrink-0 text-xs font-bold text-primary/60">
          {{ selectedValues.size }} selected
        </span>
      </div>
    </Transition>

    <!-- Choice grid -->
    <div class="grid gap-3" :class="gridClass">
      <button
        v-for="choice in activeChoices"
        :key="choice.label"
        type="button"
        class="choice-btn group relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-200"
        :class="choiceBtnClass(choice)"
        @click="handleChoiceClick(choice)"
      >
        <!-- Image zone -->
        <div class="relative aspect-square w-full overflow-hidden bg-base-300">
          <img
            v-if="choice.image"
            :src="choice.image"
            :alt="choice.label"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div v-else class="flex h-full w-full items-center justify-center">
            <span
              class="select-none text-5xl opacity-20 transition-opacity duration-200 group-hover:opacity-40"
            >
              {{ activeCard?.flourish ?? '✦' }}
            </span>
          </div>

          <!-- Selected overlay -->
          <Transition name="check-pop">
            <div
              v-if="isSelected(choice)"
              class="absolute inset-0 flex items-center justify-center bg-primary/30 backdrop-blur-sm"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40"
              >
                <Icon
                  name="kind-icon:check"
                  class="h-5 w-5 text-primary-content"
                />
              </div>
            </div>
          </Transition>

          <!-- Sub-flow badge -->
          <div
            v-if="choice.opensCustom || choice.opensList"
            class="absolute bottom-2 right-2 rounded-lg bg-base-100/80 px-2 py-0.5 text-xs font-bold text-base-content/60 backdrop-blur-sm"
          >
            {{ choice.opensCustom ? 'custom' : 'list' }}
          </div>
        </div>

        <!-- Label zone -->
        <div class="flex flex-col gap-0.5 px-3 py-2.5">
          <p
            class="font-black leading-tight text-base-content transition-colors group-hover:text-primary"
          >
            {{ choice.label }}
          </p>
          <p
            v-if="choice.subtext"
            class="line-clamp-2 text-xs leading-snug text-base-content/55"
          >
            {{ choice.subtext }}
          </p>
        </div>
      </button>
    </div>

    <!-- Custom text sub-panel -->
    <Transition name="slide-down">
      <div
        v-if="openMode === 'custom'"
        class="rounded-2xl border border-primary/30 bg-primary/5 p-4"
      >
        <p
          class="mb-2 text-xs font-bold uppercase tracking-widest text-primary/70"
        >
          Write your own
        </p>
        <div class="flex gap-2">
          <input
            ref="customInputRef"
            v-model="customValue"
            type="text"
            class="input input-bordered flex-1 rounded-xl bg-base-100 focus:border-primary"
            :placeholder="
              activeStep?.placeholder ?? 'Enter anything that fits...'
            "
            @keydown.enter="commitCustom"
          />
          <button
            type="button"
            class="btn btn-primary rounded-xl"
            :disabled="!customValue.trim()"
            @click="commitCustom"
          >
            <Icon name="kind-icon:check" class="h-4 w-4" />
            {{ isMultiSelect ? 'Add' : 'Use this' }}
          </button>
        </div>
        <button
          type="button"
          class="mt-2 text-xs text-base-content/40 underline-offset-2 hover:text-base-content/70 hover:underline"
          @click="openMode = null"
        >
          back to choices
        </button>
      </div>
    </Transition>

    <!-- Sub-list panel -->
    <Transition name="slide-down">
      <div
        v-if="openMode === 'list' && subListOptions.length"
        class="rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <p
          class="mb-3 text-xs font-bold uppercase tracking-widest text-base-content/50"
        >
          Select one
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in subListOptions"
            :key="option"
            type="button"
            class="rounded-xl border border-base-300 bg-base-200 px-3 py-1.5 text-sm font-semibold text-base-content/80 transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
            :class="
              subListSelected === option
                ? 'border-primary bg-primary/10 text-primary'
                : ''
            "
            @click="commitSubList(option)"
          >
            {{ option }}
          </button>
        </div>
        <div class="mt-3 flex gap-2">
          <input
            v-model="subListCustom"
            type="text"
            class="input input-bordered input-sm flex-1 rounded-xl bg-base-200"
            placeholder="Or type anything..."
            @keydown.enter="commitSubListCustom"
          />
          <button
            type="button"
            class="btn btn-sm btn-outline rounded-xl"
            :disabled="!subListCustom.trim()"
            @click="commitSubListCustom"
          >
            Use
          </button>
        </div>
        <button
          type="button"
          class="mt-2 text-xs text-base-content/40 underline-offset-2 hover:text-base-content/70 hover:underline"
          @click="openMode = null"
        >
          back to choices
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useAdventureStore } from '@/stores/adventureStore'
import type { PresetChoice } from '@/stores/helpers/adventureCards'

const store = useAdventureStore()

// ── Store reads ─────────────────────────────────────────────────────────────

const activeCard = computed(() => store.activeCard)
const activeStep = computed(() => store.activeStep)
const isMultiSelect = computed(() => activeStep.value?.multiSelect === true)
const activeChoices = computed<PresetChoice[]>(
  () => activeStep.value?.choices ?? [],
)
const stepKey = computed(() => activeStep.value?.key ?? '')

// ── Multi-select state ──────────────────────────────────────────────────────

// Current stored value is pipe-separated; parse into a Set for toggle logic
const selectedValues = computed<Set<string>>(() => {
  const raw = store.stagedValues[stepKey.value] ?? ''
  if (!raw.trim()) return new Set()
  return new Set(raw.split('|').filter(Boolean))
})

function toggleValue(val: string) {
  if (!val) return
  const next = new Set(selectedValues.value)
  if (next.has(val)) {
    next.delete(val)
  } else {
    next.add(val)
  }
  store.setStagedValue(stepKey.value, [...next].join('|'))
}

function labelForValue(val: string): string {
  return activeChoices.value.find((c) => c.value === val)?.label ?? val
}

// ── Single-select state ─────────────────────────────────────────────────────

const currentSingleValue = computed(
  () => store.stagedValues[stepKey.value] ?? '',
)

// ── Sub-flow state ──────────────────────────────────────────────────────────

const openMode = ref<'custom' | 'list' | null>(null)
const customValue = ref('')
const subListOptions = ref<string[]>([])
const subListSelected = ref('')
const subListCustom = ref('')
const customInputRef = ref<HTMLInputElement | null>(null)

watch(activeStep, () => {
  openMode.value = null
  customValue.value = ''
  subListOptions.value = []
  subListSelected.value = ''
  subListCustom.value = ''
})

// ── Layout ──────────────────────────────────────────────────────────────────

const gridClass = computed(() => {
  const count = activeChoices.value.length
  if (count <= 2) return 'grid-cols-2'
  if (count <= 4) return 'grid-cols-2'
  if (count <= 6) return 'grid-cols-2 sm:grid-cols-3'
  return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
})

// ── State helpers ───────────────────────────────────────────────────────────

function isSelected(choice: PresetChoice): boolean {
  if (!choice.value) return false
  if (isMultiSelect.value) return selectedValues.value.has(choice.value)
  return currentSingleValue.value === choice.value
}

function choiceBtnClass(choice: PresetChoice): string {
  if (isSelected(choice)) {
    return 'border-primary shadow-lg shadow-primary/20 scale-[1.02]'
  }
  if (
    (choice.opensCustom && openMode.value === 'custom') ||
    (choice.opensList && openMode.value === 'list')
  ) {
    return 'border-secondary/60 bg-secondary/5'
  }
  return 'border-base-300 bg-base-100 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5'
}

// ── Interactions ────────────────────────────────────────────────────────────

function handleChoiceClick(choice: PresetChoice) {
  if (choice.opensCustom) {
    openMode.value = 'custom'
    customValue.value = ''
    nextTick(() => customInputRef.value?.focus())
    return
  }

  if (choice.opensList && choice.listOptions?.length) {
    openMode.value = 'list'
    subListOptions.value = choice.listOptions
    subListCustom.value = ''
    return
  }

  if (!choice.value) return

  if (isMultiSelect.value) {
    toggleValue(choice.value)
    return
  }

  // Single-select: commit and advance
  openMode.value = null
  store.selectPresetChoice(stepKey.value, choice.value)
}

function commitCustom() {
  const val = customValue.value.trim()
  if (!val) return
  openMode.value = null
  if (isMultiSelect.value) {
    toggleValue(val)
    customValue.value = ''
  } else {
    store.selectPresetChoice(stepKey.value, val)
  }
}

function commitSubList(option: string) {
  subListSelected.value = option
  openMode.value = null
  if (isMultiSelect.value) {
    toggleValue(option)
  } else {
    store.selectPresetChoice(stepKey.value, option)
  }
}

function commitSubListCustom() {
  const val = subListCustom.value.trim()
  if (!val) return
  openMode.value = null
  if (isMultiSelect.value) {
    toggleValue(val)
    subListCustom.value = ''
  } else {
    store.selectPresetChoice(stepKey.value, val)
  }
}
</script>

<style scoped>
.choice-btn {
  display: flex;
  flex-direction: column;
}

.check-pop-enter-active {
  transition:
    opacity 150ms ease,
    transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.check-pop-leave-active {
  transition: opacity 100ms ease;
}
.check-pop-enter-from {
  opacity: 0;
  transform: scale(0.5);
}
.check-pop-leave-to {
  opacity: 0;
}

.slide-down-enter-active {
  transition:
    opacity 200ms ease,
    transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.slide-down-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
