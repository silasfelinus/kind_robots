<!-- components/pitch/pitch-builder.vue -->
<!--
  Top-level container for the Pitch Builder.
  Three-zone layout matching adventure-builder:
    - Sidebar: pitch sheet preview (left, lg+)
    - Stage: active card (center)
    - Hand: card deck tray (bottom)

  The pitch builder is intentionally lighter than the adventure builder.
  Fewer cards, shorter steps, faster path to done.
-->
<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden">
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header
      class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100/80 px-4 py-2.5 backdrop-blur-sm"
    >
      <div class="flex items-center gap-2.5">
        <Icon name="kind-icon:layers" class="h-5 w-5 text-primary" />
        <h1 class="text-lg font-black tracking-tight text-base-content">
          Pitch Builder
        </h1>
        <span
          v-if="pitchStore.pitchForm.PitchType"
          class="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary"
        >
          {{
            pitchStore.pitchForm.PitchType === 'ARTPITCH'
              ? 'Art Pitch'
              : 'Dream'
          }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <!-- Reset -->
        <button
          type="button"
          class="btn btn-sm btn-ghost rounded-xl text-base-content/40 hover:text-error"
          :disabled="isSaving"
          @click="confirmReset"
        >
          <Icon name="kind-icon:trash" class="h-4 w-4" />
          <span class="hidden sm:inline">Reset</span>
        </button>

        <!-- Save -->
        <button
          type="button"
          class="btn btn-sm btn-primary rounded-xl gap-1.5"
          :disabled="!canSave || isSaving"
          @click="doSave"
        >
          <span v-if="isSaving" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:save" class="h-4 w-4" />
          <span class="hidden sm:inline">Save</span>
        </button>
      </div>
    </header>

    <!-- ── Body ────────────────────────────────────────────────────────── -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar: pitch sheet preview -->
      <aside
        v-if="!isMobile"
        class="flex w-64 shrink-0 flex-col border-r border-base-300 bg-base-100/60 backdrop-blur-sm"
      >
        <pitch-sheet />
      </aside>

      <!-- Center: stage -->
      <main class="flex flex-1 flex-col overflow-hidden">
        <pitch-stage class="flex-1 overflow-y-auto" />
      </main>
    </div>

    <!-- ── Hand tray ────────────────────────────────────────────────────── -->
    <pitch-hand
      class="shrink-0 border-t border-base-300 bg-base-100/80 backdrop-blur-sm"
    />

    <!-- ── Reset confirm ────────────────────────────────────────────────── -->
    <Transition name="fade">
      <div
        v-if="showResetConfirm"
        class="absolute inset-0 z-50 flex items-center justify-center bg-base-300/60 backdrop-blur-sm"
        @click.self="showResetConfirm = false"
      >
        <div
          class="rounded-3xl border border-base-300 bg-base-100 p-8 shadow-2xl"
        >
          <p class="mb-1 text-lg font-black text-base-content">Reset pitch?</p>
          <p class="mb-6 text-sm text-base-content/60">
            This clears everything and starts fresh.
          </p>
          <div class="flex gap-3">
            <button
              type="button"
              class="btn btn-outline rounded-xl"
              @click="showResetConfirm = false"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-error rounded-xl"
              @click="doReset"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Save feedback ────────────────────────────────────────────────── -->
    <Transition name="slide-up">
      <div
        v-if="pitchStore.lastError"
        class="absolute bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg"
        :class="'bg-error text-error-content'"
      >
        {{ pitchStore.lastError }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { usePitchBuilderStore } from '@/stores/pitchBuilderStore'
import { usePitchStore } from '@/stores/pitchStore'
import { useUserStore } from '@/stores/userStore'

const builder = usePitchBuilderStore()
const pitchStore = usePitchStore()
const userStore = useUserStore()

const isSaving = computed(() => pitchStore.isSaving)
const showResetConfirm = ref(false)
const savedPitchId = ref<number | null>(null)

// Mobile breakpoint
const isMobile = ref(false)
function updateBreakpoint() {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  builder.restoreState()
  if (!builder.activeCardKey && builder.visibleCards.length) {
    builder.selectCard('type')
  }
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateBreakpoint)
})

// Can save once we have a pitch text
const canSave = computed(
  () => Boolean(pitchStore.pitchForm.pitch?.trim()) && !pitchStore.isSaving,
)

function confirmReset() {
  showResetConfirm.value = true
}

function doReset() {
  showResetConfirm.value = false
  savedPitchId.value = null
  builder.resetBuilder()
  builder.selectCard('type')
}

async function doSave() {
  const result = await pitchStore.savePitch()
  if (result.success && result.data?.id) {
    savedPitchId.value = result.data.id
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition:
    opacity 200ms ease,
    transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.slide-up-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
