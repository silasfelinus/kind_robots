<!-- /components/content/butterfly/butterfly-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="relative h-full w-full overflow-hidden rounded-2xl border border-white/30 bg-info/90"
  >
    <div
      class="pointer-events-none fixed inset-0 z-1 overflow-hidden opacity-0"
    >
      <butterfly-canvas :fallback-image="'/images/art1.webp'" />
    </div>

    <div
      v-if="isCompact"
      class="relative z-10 flex h-full w-full items-center justify-between gap-2 overflow-x-auto rounded-2xl bg-black/40 px-3 py-2"
    >
      <button class="control-btn compact-btn shrink-0" @click="addButterfly">
        Add Butterfly
      </button>

      <div
        class="shrink-0 rounded-2xl border border-white/20 bg-black/60 px-4 py-2 text-center text-sm font-semibold text-white"
      >
        Butterflies: {{ butterflyCount }}
      </div>

      <button
        class="control-btn compact-btn shrink-0"
        :disabled="butterflyCount === 0"
        @click="removeButterfly"
      >
        Remove Butterfly
      </button>
    </div>

    <div
      v-else
      class="relative z-10 grid h-full w-full min-h-0 grid-cols-1 gap-2 overflow-y-auto p-2 md:gap-4 md:p-4 lg:grid-cols-2"
    >
      <div
        class="flex min-h-0 flex-col gap-3 rounded-2xl bg-black/50 p-3 md:p-4"
      >
        <div
          class="rounded-2xl border border-white/10 bg-base-200/20 p-3 md:p-4"
        >
          <div class="flex flex-col gap-4">
            <div class="rounded-2xl bg-black/60 p-3 text-center text-white">
              Butterflies: {{ butterflyCount }}
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button class="control-btn" @click="toggleAmiSwarm">
                {{ showSwarm ? 'Stop' : 'Start' }} Animation
              </button>

              <button class="control-btn" @click="addButterfly">
                Add Butterfly
              </button>

              <button
                class="control-btn"
                :disabled="butterflyCount === 0"
                @click="removeButterfly"
              >
                Remove Butterfly
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex min-h-56 flex-col gap-3 rounded-2xl bg-base-200 p-3 md:p-4"
      >
        <div class="rounded-2xl bg-black p-3 text-center text-white">
          Butterfly Demo
        </div>

        <div class="min-h-0 flex-1 overflow-hidden rounded-2xl bg-info/80">
          <butterfly-demo class="h-full w-full" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/butterfly/butterfly-footer.vue
import { computed, ref } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'

const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isExpanded = computed(
  () => footerState.value === 'open' || footerState.value === 'priority',
)

const butterflyCount = computed(() => butterflyStore.butterflies.length)

const showSwarm = ref(false)
const swarmSize = ref(15)

const toggleAmiSwarm = () => {
  showSwarm.value = !showSwarm.value

  if (showSwarm.value) {
    butterflyStore.generateInitialButterflies(swarmSize.value)
    butterflyStore.animateButterflies()
    return
  }

  butterflyStore.clearButterflies()
  butterflyStore.pauseAnimation()
}

const addButterfly = () => {
  butterflyStore.generateInitialButterflies(1)
}

const removeButterfly = () => {
  if (butterflyCount.value > 0) {
    butterflyStore.removeLastButterfly()
  }
}
</script>

<style scoped>
.control-btn {
  background-color: #1d4ed8;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s,
    opacity 0.2s;
}

.control-btn:hover {
  transform: scale(1.03);
}

.control-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.compact-btn {
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
}
</style>
