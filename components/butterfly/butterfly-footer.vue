<!-- /components/content/butterfly/butterfly-sanctuary.vue -->
<template>
  <div
    class="relative overflow-hidden rounded-2xl border border-white/30 bg-info/90"
    :style="{ width: centerWidth, height: centerHeight }"
  >
    <div
      class="pointer-events-none fixed inset-0 z-1 overflow-hidden opacity-0"
    >
      <butterfly-canvas :fallback-image="'/images/art1.webp'" />
    </div>

    <div
      class="relative z-10 grid h-full w-full gap-1 md:gap-4"
      :class="showDemo ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'"
    >
      <div
        class="flex h-full min-h-0 flex-col justify-between gap-3 bg-black/50 p-2 md:p-4 rounded-2xl"
      >
        <div
          class="flex-1 rounded-2xl border border-white/10 bg-base-200/20 p-3 md:p-4"
        >
          <div class="flex h-full flex-col justify-between gap-4">
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
              <button class="control-btn" @click="removeButterfly">
                Remove Butterfly
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="showDemo"
        class="flex h-full min-h-0 flex-col gap-3 rounded-2xl bg-base-200 p-2 md:p-4"
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
// /components/content/butterfly/butterfly-sanctuary.vue
import { computed, ref } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'

const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()

const centerHeight = computed(() => displayStore.mainContentHeight)
const centerWidth = computed(() => displayStore.mainContentWidth)

const butterflyCount = computed(() => butterflyStore.butterflies.length)

const footerState = computed(() => displayStore.footerState)
const showDemo = computed(
  () => footerState.value === 'open' || footerState.value === 'priority',
)

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
  padding: 10px 20px;
  border-radius: 1rem;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
}

.control-btn:hover {
  transform: scale(1.05);
}
</style>
