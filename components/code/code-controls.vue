<!-- /components/code/code-controls.vue -->
<template>
  <section
    class="flex flex-wrap items-center gap-2 rounded-2xl border border-base-300 bg-base-100/95 p-2 shadow-lg backdrop-blur"
  >
    <div
      class="flex items-center overflow-hidden rounded-2xl border border-base-300 bg-base-200"
    >
      <button
        class="btn btn-ghost btn-xs rounded-none"
        type="button"
        title="Zoom out"
        @click="codeStore.zoomOut()"
      >
        <icon name="kind-icon:minus" class="h-4 w-4" />
      </button>

      <button
        class="btn btn-ghost btn-xs rounded-none px-3 font-black"
        type="button"
        title="Reset zoom"
        @click="codeStore.resetZoom()"
      >
        {{ codeStore.zoomPercent }}%
      </button>

      <button
        class="btn btn-ghost btn-xs rounded-none"
        type="button"
        title="Zoom in"
        @click="codeStore.zoomIn()"
      >
        <icon name="kind-icon:plus" class="h-4 w-4" />
      </button>
    </div>

    <button
      class="btn btn-xs rounded-2xl"
      :class="codeStore.isPanMode ? 'btn-primary' : 'btn-outline'"
      type="button"
      title="Toggle pan mode"
      @click="codeStore.togglePanMode()"
    >
      <icon name="kind-icon:move" class="h-4 w-4" />
      <span class="hidden sm:inline">Pan</span>
    </button>

    <button
      class="btn btn-xs rounded-2xl"
      :class="codeStore.snapToGrid ? 'btn-primary' : 'btn-outline'"
      type="button"
      title="Toggle snap to grid"
      @click="codeStore.toggleSnapToGrid()"
    >
      <icon name="kind-icon:grid" class="h-4 w-4" />
      <span class="hidden sm:inline">Snap</span>
    </button>

    <button
      class="btn btn-xs rounded-2xl"
      :class="codeStore.showCanvasGrid ? 'btn-primary' : 'btn-outline'"
      type="button"
      title="Toggle grid"
      @click="codeStore.toggleCanvasGrid()"
    >
      <icon name="kind-icon:blueprint" class="h-4 w-4" />
      <span class="hidden sm:inline">Grid</span>
    </button>

    <button
      class="btn btn-xs rounded-2xl"
      :class="codeStore.showMiniMap ? 'btn-primary' : 'btn-outline'"
      type="button"
      title="Toggle minimap"
      @click="codeStore.toggleMiniMap()"
    >
      <icon name="kind-icon:map" class="h-4 w-4" />
      <span class="hidden sm:inline">Map</span>
    </button>

    <button
      class="btn btn-xs btn-outline rounded-2xl"
      type="button"
      title="Fit graph to view"
      @click="fitCanvas"
    >
      <icon name="kind-icon:expand" class="h-4 w-4" />
      <span class="hidden sm:inline">Fit</span>
    </button>

    <div class="h-6 w-px bg-base-300" />

    <button
      class="btn btn-xs rounded-2xl"
      :class="validationButtonClass"
      type="button"
      title="Validate graph"
      @click="validateGraph"
    >
      <icon :name="validationIcon" class="h-4 w-4" />
      <span class="hidden sm:inline">Validate</span>
    </button>

    <!-- Cancel button shows while running, Run button shows otherwise -->
    <button
      v-if="isRunning"
      class="btn btn-xs btn-warning rounded-2xl"
      type="button"
      title="Cancel run (abort all streams)"
      @click="cancelGraph"
    >
      <icon name="kind-icon:stop" class="h-4 w-4" />
      <span class="hidden sm:inline">Cancel</span>
      <span
        v-if="activeCount > 0"
        class="badge badge-xs badge-warning border-warning-content/20 bg-warning-content/20 text-warning-content"
      >
        {{ activeCount }}
      </span>
    </button>

    <button
      v-else
      class="btn btn-xs rounded-2xl"
      :class="runButtonClass"
      type="button"
      title="Run graph"
      @click="runGraph"
    >
      <icon
        :name="runIcon"
        class="h-4 w-4"
        :class="{ 'animate-spin': codeStore.runStatus === 'queued' }"
      />
      <span class="hidden sm:inline">
        {{ runLabel }}
      </span>
    </button>

    <button
      v-if="codeStore.runStatus !== 'idle' && !isRunning"
      class="btn btn-xs btn-outline rounded-2xl"
      type="button"
      title="Clear run results"
      @click="codeStore.clearRunResults()"
    >
      <icon name="kind-icon:x" class="h-4 w-4" />
      <span class="hidden sm:inline">Clear Run</span>
    </button>

    <button
      v-if="codeStore.pendingConnection"
      class="btn btn-xs btn-warning rounded-2xl"
      type="button"
      title="Cancel current connection"
      @click="codeStore.cancelConnection()"
    >
      <icon name="kind-icon:unlink" class="h-4 w-4" />
      <span class="hidden sm:inline">Cancel Link</span>
    </button>

    <div
      v-if="statusMessage"
      class="max-w-full rounded-2xl border px-3 py-1.5 text-xs font-bold"
      :class="statusClass"
    >
      {{ statusMessage }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCodeStore } from '@/stores/codeStore'

const codeStore = useCodeStore()

const statusMessage = ref('')
const statusTone = ref<'info' | 'success' | 'warning' | 'error'>('info')
const lastValidationSuccess = ref<boolean | null>(null)

const isRunning = computed(() => {
  return (
    codeStore.runStatus === 'running' || codeStore.runStatus === 'queued'
  )
})

const activeCount = computed(() => {
  return codeStore.activeRunNodeIds?.size ?? 0
})

const validationButtonClass = computed(() => {
  if (lastValidationSuccess.value === true) {
    return 'btn-success'
  }

  if (lastValidationSuccess.value === false) {
    return 'btn-error'
  }

  return 'btn-outline'
})

const validationIcon = computed(() => {
  if (lastValidationSuccess.value === true) {
    return 'kind-icon:check'
  }

  if (lastValidationSuccess.value === false) {
    return 'kind-icon:alert'
  }

  return 'kind-icon:checklist'
})

const runButtonClass = computed(() => {
  if (codeStore.runStatus === 'error') {
    return 'btn-error'
  }

  if (codeStore.runStatus === 'success') {
    return 'btn-success'
  }

  if (codeStore.runStatus === 'cancelled') {
    return 'btn-warning'
  }

  return 'btn-primary'
})

const runIcon = computed(() => {
  if (codeStore.runStatus === 'queued') {
    return 'kind-icon:spinner'
  }

  if (codeStore.runStatus === 'error') {
    return 'kind-icon:alert'
  }

  if (codeStore.runStatus === 'success') {
    return 'kind-icon:check'
  }

  if (codeStore.runStatus === 'cancelled') {
    return 'kind-icon:refresh'
  }

  return 'kind-icon:play'
})

const runLabel = computed(() => {
  if (codeStore.runStatus === 'queued') return 'Queued'
  if (codeStore.runStatus === 'success') return 'Done'
  if (codeStore.runStatus === 'error') return 'Failed'
  if (codeStore.runStatus === 'cancelled') return 'Run Again'
  return 'Run'
})

const statusClass = computed(() => {
  const classes = {
    info: 'border-info/30 bg-info/10 text-info-content',
    success: 'border-success/30 bg-success/10 text-success-content',
    warning: 'border-warning/30 bg-warning/10 text-warning-content',
    error: 'border-error/30 bg-error/10 text-error-content',
  }

  return classes[statusTone.value]
})

function setStatus(
  message: string,
  tone: 'info' | 'success' | 'warning' | 'error' = 'info',
) {
  statusMessage.value = message
  statusTone.value = tone
}

function fitCanvas() {
  const viewport = {
    width: codeStore.viewportWidth,
    height: codeStore.viewportHeight,
  }

  const nextZoom = codeStore.fitToView(viewport)

  setStatus(`Fit view: ${Math.round(nextZoom * 100)}%`, 'info')
}

function validateGraph() {
  const result = codeStore.validateCurrentGraph()

  lastValidationSuccess.value = result.success

  if (result.errors.length) {
    setStatus(result.message, 'error')
    return
  }

  if (result.warnings.length) {
    setStatus(result.message, 'warning')
    return
  }

  setStatus(result.message, 'success')
}

async function runGraph() {
  const result = await codeStore.runCurrentGraph()

  if (result.success) {
    setStatus(result.message || 'Graph run complete.', 'success')
    return
  }

  setStatus(result.message || 'Graph run failed.', 'error')
}

function cancelGraph() {
  const result = codeStore.cancelRun()
  setStatus(result.message || 'Run cancelled.', 'warning')
}
</script>
