<!-- components/adventure/adventure-preset.vue -->
<!--
  Illustrated CYOA choice buttons.
  Reads activeStep.choices from adventureStore.
  No emits. All state via store.

  Flow:
    normal choice  → store.selectPresetChoice(step.key, value)
    opensCustom    → reveals inline text input; commit on Enter or button
    opensList      → reveals sub-list of listOptions as chips
-->
<template>
  <div class="flex flex-col gap-4">
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

          <!-- Fallback: flourish from active card -->
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

          <!-- Opens-more badge -->
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
            Use this
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

        <!-- Custom within sub-list -->
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
const activeChoices = computed<PresetChoice[]>(
  () => activeStep.value?.choices ?? [],
)

// ── Local sub-flow state ────────────────────────────────────────────────────

const openMode = ref<'custom' | 'list' | null>(null)
const customValue = ref('')
const subListOptions = ref<string[]>([])
const subListSelected = ref('')
const subListCustom = ref('')
const customInputRef = ref<HTMLInputElement | null>(null)

// Reset sub-flow when step changes
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
  if (count <= 4) return 'grid-cols-2 sm:grid-cols-2'
  if (count <= 6) return 'grid-cols-2 sm:grid-cols-3'
  return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
})

// ── State helpers ───────────────────────────────────────────────────────────

const stepKey = computed(() => activeStep.value?.key ?? '')
const currentValue = computed(() => store.stagedValues[stepKey.value] ?? '')

function isSelected(choice: PresetChoice): boolean {
  if (!choice.value) return false
  return currentValue.value === choice.value
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
  // Sub-flow: custom text
  if (choice.opensCustom) {
    openMode.value = 'custom'
    customValue.value = currentValue.value
    nextTick(() => customInputRef.value?.focus())
    return
  }

  // Sub-flow: sub-list
  if (choice.opensList && choice.listOptions?.length) {
    openMode.value = 'list'
    subListOptions.value = choice.listOptions
    subListCustom.value = ''
    return
  }

  // Normal commit — value carries to sheet, advances step / finishes card
  if (choice.value) {
    openMode.value = null
    store.selectPresetChoice(stepKey.value, choice.value)
  }
}

function commitCustom() {
  const val = customValue.value.trim()
  if (!val) return
  openMode.value = null
  store.selectPresetChoice(stepKey.value, val)
}

function commitSubList(option: string) {
  subListSelected.value = option
  openMode.value = null
  store.selectPresetChoice(stepKey.value, option)
}

function commitSubListCustom() {
  const val = subListCustom.value.trim()
  if (!val) return
  openMode.value = null
  store.selectPresetChoice(stepKey.value, val)
}
</script>

<style scoped>
/* Choice button image aspect ratio fix */
.choice-btn {
  display: flex;
  flex-direction: column;
}

/* Check mark pop animation */
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

/* Sub-panel slide */
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
