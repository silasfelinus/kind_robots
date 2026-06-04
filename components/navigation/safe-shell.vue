<!-- /components/navigation/safe-dashboard-shell.vue -->
<template>
  <dashboard-shell v-if="!shellFailed">
    <slot />
  </dashboard-shell>

  <div v-else class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      class="mb-3 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-warning"
    >
      <div class="flex min-w-0 items-center gap-2">
        <Icon name="kind-icon:warning" class="h-5 w-5 shrink-0" />
        <p class="truncate text-sm font-black">
          Dashboard shell failed, showing fallback stage.
        </p>
      </div>

      <button
        type="button"
        class="btn btn-xs rounded-xl"
        @click="retryShell"
      >
        Retry
      </button>
    </div>

    <section
      class="min-h-0 flex-1 overflow-y-auto rounded-xl border border-base-300 bg-base-100 p-3 sm:p-4"
    >
      <slot />
    </section>
  </div>
</template>

<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

const shellFailed = ref(false)

function retryShell() {
  shellFailed.value = false
}

onErrorCaptured((error) => {
  shellFailed.value = true
  console.error('[safe-dashboard-shell] Dashboard shell failed:', error)
  return false
})
</script>