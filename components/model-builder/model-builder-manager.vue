<!-- /components/model-builder/model-builder-manager.vue -->
<template>
  <section
    class="flex h-full min-h-0 max-h-full w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
  >
    <header
      class="flex h-10 shrink-0 items-center gap-2 border-b border-base-300 bg-base-100 px-2 sm:px-3"
    >
      <Icon name="kind-icon:blueprint" class="h-4 w-4 shrink-0 text-primary" />

      <h2
        class="truncate text-sm font-black leading-none text-base-content sm:text-base"
      >
        Model Builder
      </h2>

      <nav class="ml-2 hidden min-w-0 flex-1 items-center gap-1 sm:flex">
        <button
          v-for="(crumb, index) in crumbs"
          :key="crumb.step"
          type="button"
          class="btn btn-xs h-7 min-h-7 rounded-xl px-2 text-xs font-semibold"
          :class="
            store.step === crumb.step
              ? 'btn-primary'
              : crumb.enabled
                ? 'btn-ghost text-base-content/60'
                : 'btn-ghost text-base-content/30 pointer-events-none'
          "
          @click="crumb.enabled && store.goToStep(crumb.step)"
        >
          <span class="opacity-50">{{ index + 1 }}.</span>
          {{ crumb.label }}
        </button>
      </nav>

      <button
        type="button"
        class="btn btn-xs btn-ghost ml-auto h-7 min-h-7 rounded-xl px-2"
        :class="showHistory ? 'text-primary' : 'text-base-content/60 hover:text-primary'"
        @click="showHistory = !showHistory"
      >
        <Icon name="kind-icon:clock" class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">History</span>
      </button>

      <button
        type="button"
        class="btn btn-xs btn-ghost h-7 min-h-7 rounded-xl px-2 text-base-content/60 hover:text-error"
        @click="store.resetAll()"
      >
        <Icon name="kind-icon:trash" class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">Reset</span>
      </button>
    </header>

    <Transition name="mb-feedback">
      <div
        v-if="store.statusMessage"
        class="shrink-0 border-b px-3 py-1 text-xs font-semibold"
        :class="
          store.statusTone === 'error'
            ? 'border-error/30 bg-error/10 text-error'
            : 'border-success/30 bg-success/10 text-success'
        "
      >
        {{ store.statusMessage }}
      </div>
    </Transition>

    <main class="flex min-h-0 flex-1 flex-col overflow-y-auto p-2 sm:p-3">
      <model-builder-run-history
        v-if="showHistory"
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
import { computed, onMounted, ref } from 'vue'
import { useModelBuilderStore } from '@/stores/modelBuilderStore'

const store = useModelBuilderStore()
const showHistory = ref(false)

const crumbs = computed(() => [
  { step: 'source' as const, label: 'Source', enabled: true },
  {
    step: 'recipe' as const,
    label: 'Recipe',
    enabled: Boolean(store.selectedSource),
  },
  { step: 'run' as const, label: 'Run', enabled: Boolean(store.run) },
])

onMounted(() => {
  store.resumeRun()
})
</script>

<style scoped>
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
