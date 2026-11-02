<!-- /components/model-builder/model-builder-manager.vue -->
<template>
  <section
    class="flex h-full min-h-0 max-h-full w-full flex-col overflow-hidden kr-panel-muted"
    :aria-busy="resumingRun"
  >
    <header-page-bar>
      <div class="mb-bar" data-testid="model-builder-page-bar">
        <nav class="mb-bar-crumbs" aria-label="Model Builder steps">
          <button
            v-for="(crumb, index) in crumbs"
            :key="crumb.step"
            type="button"
            class="kr-btn-xs h-7 min-h-7 px-2 text-xs font-semibold"
            :class="
              store.step === crumb.step
                ? 'btn-primary'
                : crumb.enabled
                  ? 'btn-ghost text-base-content/60'
                  : 'btn-ghost text-base-content/30 pointer-events-none'
            "
            :disabled="!crumb.enabled || store.startingRun || resumingRun"
            @click="crumb.enabled && store.goToStep(crumb.step)"
          >
            <span class="mb-bar-step-number opacity-50">{{ index + 1 }}.</span>
            {{ crumb.label }}
          </button>
        </nav>

        <button
          ref="historyToggleButton"
          type="button"
          class="kr-btn-xs btn-ghost ml-auto h-7 min-h-7 shrink-0 px-2"
          :class="
            showHistory
              ? 'text-primary'
              : 'text-base-content/60 hover:text-primary'
          "
          :disabled="store.startingRun || resumingRun"
          aria-label="Toggle run history"
          :aria-pressed="showHistory"
          @click="showHistory = !showHistory"
        >
          <Icon name="kind-icon:clock" class="kr-icon-3-5" />
          <span class="mb-bar-label">History</span>
        </button>

        <button
          type="button"
          class="kr-btn-xs btn-ghost h-7 min-h-7 shrink-0 px-2 text-base-content/60 hover:text-error"
          :disabled="store.startingRun || resumingRun"
          aria-label="Reset Model Builder"
          @click="store.resetAll()"
        >
          <Icon name="kind-icon:trash" class="kr-icon-3-5" />
          <span class="mb-bar-label">Reset</span>
        </button>
      </div>
    </header-page-bar>

    <Transition name="mb-feedback">
      <div
        v-if="store.statusMessage"
        class="shrink-0 border-b px-3 py-1 text-xs font-semibold"
        :class="
          store.statusTone === 'error' ? 'kr-note-error' : 'kr-note-success'
        "
        :role="store.statusTone === 'error' ? 'alert' : 'status'"
        aria-atomic="true"
      >
        {{ store.statusMessage }}
      </div>
    </Transition>

    <main
      ref="mainContent"
      tabindex="-1"
      aria-label="Model Builder step content"
      class="flex min-h-0 flex-1 flex-col overflow-y-auto p-2 sm:p-3"
    >
      <div
        v-if="resumingRun"
        class="kr-text-dim-sm flex min-h-32 flex-1 items-center justify-center gap-2"
        role="status"
        aria-live="polite"
      >
        <span class="kr-spinner-md-dots" aria-hidden="true" />
        Restoring your latest build run…
      </div>
      <model-builder-run-history
        v-else-if="showHistory"
        @close="showHistory = false"
      />
      <template v-else>
        <model-builder-source-picker v-if="store.step === 'source'" />
        <model-builder-recipe-selector v-else-if="store.step === 'recipe'" />
        <model-builder-progress-matrix v-else-if="store.step === 'run'" />
      </template>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useModelBuilderStore } from '@/stores/modelBuilderStore'

const store = useModelBuilderStore()
const showHistory = ref(false)
const resumingRun = ref(true)
const historyToggleButton = ref<HTMLButtonElement | null>(null)
const mainContent = ref<HTMLElement | null>(null)

const crumbs = computed(() => [
  { step: 'source' as const, label: 'Source', enabled: true },
  {
    step: 'recipe' as const,
    label: 'Recipe',
    enabled: Boolean(store.selectedSource),
  },
  { step: 'run' as const, label: 'Run', enabled: Boolean(store.run) },
])

onMounted(async () => {
  try {
    await store.resumeRun()
  } finally {
    resumingRun.value = false
  }
})

// The run-history panel (model-builder-run-history.vue) can close itself
// from a button *inside* the panel -- "Open" on a run or "New run" both emit
// `close` (see their own click handlers) rather than going back through the
// header's own toggle button below. That inside button unmounts along with
// the whole panel, and since nothing here ever moves focus anywhere else,
// the browser drops it to <body> -- keyboard/screen-reader users lose their
// place entirely and have to tab in again from the very top of the page,
// instead of picking back up at the control that reopened the step they're
// now looking at. Restoring focus to the toggle button itself (whether the
// panel closed via that same button, a harmless no-op re-focus, or via one
// of the inside buttons, the actual gap) keeps keyboard navigation anchored
// to a sensible, discoverable spot. Mirrors academy-timeline.vue's
// closeLesson() -- nextTick() then ref.value?.focus() -- for the identical
// close-from-inside-the-panel shape.
watch(showHistory, (isOpen) => {
  if (isOpen) return
  nextTick(() => {
    historyToggleButton.value?.focus()
  })
})

// The same focus-loss shape as the watcher above, one level down: several
// buttons *inside* the current step's own component change store.step,
// unmounting that whole component (and the clicked button with it) via the
// v-if/v-else-if chain above -- model-builder-progress-matrix.vue's "New
// run" (store.resetRun()), model-builder-recipe-selector.vue's "Change
// source" (store.goToStep('source')), and model-builder-source-picker.vue's
// record buttons (store.selectSource()) all mutate step synchronously, with
// nothing moving focus anywhere afterward, so the browser drops it to
// <body> exactly like the history-panel case. The page bar's own crumb nav
// buttons also change store.step, but they live in <header-page-bar>, which
// never unmounts across a step change -- a crumb click keeps focus right where it
// already correctly was, and must stay untouched, so this can't just watch
// store.step unconditionally the way the showHistory watch above does.
// Checking `mainContent.value?.contains(document.activeElement)` at watch
// time (before Vue patches the DOM for the new step, so activeElement is
// still whatever was focused at the moment of the click that changed step)
// tells the two shapes apart: true only when the control that changed the
// step was itself inside <main> -- the step content about to be replaced --
// never for a crumb click, which lives outside it. <main> carries
// tabindex="-1" so it can receive focus programmatically without joining
// the normal Tab order, and it never unmounts across any step or the
// history-panel toggle, so it's always a safe landing spot.
//
// This can fire in the same tick as the showHistory watch above (e.g.
// "New run" inside model-builder-run-history.vue calls store.resetRun()
// then emits `close`, changing both step and showHistory at once) -- both
// watchers' nextTick callbacks then run in registration order, so this one
// (registered second) wins and focus lands on the newly-shown step's
// content, which is the more useful outcome of the two when the step
// itself actually changed.
watch(
  () => store.step,
  () => {
    if (!mainContent.value?.contains(document.activeElement)) return
    nextTick(() => {
      mainContent.value?.focus()
    })
  },
)
</script>

<style scoped>
.mb-bar {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 0.25rem;
}
.mb-bar-crumbs {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 0.25rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}
.mb-bar-crumbs::-webkit-scrollbar {
  display: none;
}
.mb-bar-crumbs > * {
  flex: none;
}
@container (max-width: 520px) {
  .mb-bar-label {
    display: none;
  }
}
@container (max-width: 380px) {
  .mb-bar-step-number {
    display: none;
  }
}

.mb-feedback-enter-active,
.mb-feedback-leave-active {
  transition: all 180ms ease;
}

.mb-feedback-enter-from,
.mb-feedback-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
